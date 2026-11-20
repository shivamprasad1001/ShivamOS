export type PongDifficulty = 'easy' | 'medium' | 'hard';

export interface PongState {
  width: number;
  height: number;
  paddleW: number;
  paddleH: number;
  ballSize: number;
  playerY: number;
  cpuY: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  playerScore: number;
  cpuScore: number;
  winScore: number;
  rally: number;
  maxRally: number;
  hitstop: number;
  difficulty: PongDifficulty;
  status: 'title' | 'playing' | 'paused' | 'gameover';
  winner: 'player' | 'cpu' | null;
}

export const PONG_WIDTH = 440;
export const PONG_HEIGHT = 272;

const CPU_SPEED: Record<PongDifficulty, number> = {
  easy: 165,
  medium: 235,
  hard: 305,
};

export function createInitialPongState(
  difficulty: PongDifficulty = 'medium',
  status: PongState['status'] = 'title'
): PongState {
  const paddleH = 56;
  return {
    width: PONG_WIDTH,
    height: PONG_HEIGHT,
    paddleW: 10,
    paddleH,
    ballSize: 10,
    playerY: (PONG_HEIGHT - paddleH) / 2,
    cpuY: (PONG_HEIGHT - paddleH) / 2,
    ballX: PONG_WIDTH / 2 - 5,
    ballY: PONG_HEIGHT / 2 - 5,
    ballVx: 220,
    ballVy: 95,
    playerScore: 0,
    cpuScore: 0,
    winScore: 5,
    rally: 0,
    maxRally: 0,
    hitstop: 0,
    difficulty,
    status,
    winner: null,
  };
}

export function resetBall(
  state: PongState,
  serveDirection: 1 | -1,
  rng: () => number = Math.random
): PongState {
  const angle = (rng() - 0.5) * 0.7;
  const baseSpeed = 230;
  return {
    ...state,
    ballX: state.width / 2 - state.ballSize / 2,
    ballY: state.height / 2 - state.ballSize / 2,
    ballVx: Math.cos(angle) * baseSpeed * serveDirection,
    ballVy: Math.sin(angle) * baseSpeed,
    rally: 0,
    hitstop: 0.25,
  };
}

export interface PongStepOutput {
  state: PongState;
  event: 'none' | 'wall' | 'paddle' | 'score_player' | 'score_cpu';
  impactPoint?: { x: number; y: number };
}

export function stepPong(
  state: PongState,
  rawDt: number,
  playerInput: { up: boolean; down: boolean; targetY: number | null },
  rng: () => number = Math.random
): PongStepOutput {
  if (state.status !== 'playing') {
    return { state, event: 'none' };
  }

  const dt = Math.min(rawDt, 0.05);
  const paddleSpeed = 310;
  const maxPaddleY = state.height - state.paddleH;

  // Player paddle control (keyboard or direct pointer target)
  let nextPlayerY = state.playerY;
  if (playerInput.targetY !== null) {
    const desired = playerInput.targetY - state.paddleH / 2;
    const diff = desired - nextPlayerY;
    const maxStep = paddleSpeed * 1.7 * dt;
    nextPlayerY += Math.max(-maxStep, Math.min(maxStep, diff));
  } else {
    if (playerInput.up) nextPlayerY -= paddleSpeed * dt;
    if (playerInput.down) nextPlayerY += paddleSpeed * dt;
  }
  nextPlayerY = Math.max(0, Math.min(maxPaddleY, nextPlayerY));

  // CPU paddle policy: tracks ball when approaching, drifts gently toward center when receding
  const cpuCenter = state.cpuY + state.paddleH / 2;
  const targetCenter =
    state.ballVx > 0 ? state.ballY + state.ballSize / 2 : state.height / 2;
  const cpuDelta = targetCenter - cpuCenter;
  const cpuStep = CPU_SPEED[state.difficulty] * dt;
  let nextCpuY = state.cpuY;
  if (Math.abs(cpuDelta) > 6) {
    nextCpuY += Math.sign(cpuDelta) * Math.min(Math.abs(cpuDelta), cpuStep);
  }
  nextCpuY = Math.max(0, Math.min(maxPaddleY, nextCpuY));

  if (state.hitstop > 0) {
    return {
      state: {
        ...state,
        playerY: nextPlayerY,
        cpuY: nextCpuY,
        hitstop: Math.max(0, state.hitstop - dt),
      },
      event: 'none',
    };
  }

  let bx = state.ballX + state.ballVx * dt;
  let by = state.ballY + state.ballVy * dt;
  let bvx = state.ballVx;
  let bvy = state.ballVy;
  let rally = state.rally;
  let maxRally = state.maxRally;
  let hitstop = 0;
  let event: PongStepOutput['event'] = 'none';
  let impactPoint: { x: number; y: number } | undefined;

  // Top / bottom wall bounce
  if (by <= 0) {
    by = 0;
    bvy = Math.abs(bvy);
    event = 'wall';
  } else if (by + state.ballSize >= state.height) {
    by = state.height - state.ballSize;
    bvy = -Math.abs(bvy);
    event = 'wall';
  }

  const playerPaddleX = 16;
  const cpuPaddleX = state.width - 16 - state.paddleW;

  // Left (Player) paddle collision
  if (
    bvx < 0 &&
    bx <= playerPaddleX + state.paddleW &&
    bx + state.ballSize >= playerPaddleX &&
    by + state.ballSize >= nextPlayerY &&
    by <= nextPlayerY + state.paddleH
  ) {
    bx = playerPaddleX + state.paddleW;
    const rel = ((by + state.ballSize / 2) - (nextPlayerY + state.paddleH / 2)) / (state.paddleH / 2);
    const clampedRel = Math.max(-1, Math.min(1, rel));
    const speed = Math.min(460, Math.hypot(bvx, bvy) * 1.07);
    const bounceAngle = clampedRel * 0.95;
    bvx = Math.cos(bounceAngle) * speed;
    bvy = Math.sin(bounceAngle) * speed;
    rally += 1;
    maxRally = Math.max(maxRally, rally);
    hitstop = 0.035;
    event = 'paddle';
    impactPoint = { x: bx, y: by + state.ballSize / 2 };
  }

  // Right (CPU) paddle collision
  if (
    bvx > 0 &&
    bx + state.ballSize >= cpuPaddleX &&
    bx <= cpuPaddleX + state.paddleW &&
    by + state.ballSize >= nextCpuY &&
    by <= nextCpuY + state.paddleH
  ) {
    bx = cpuPaddleX - state.ballSize;
    const rel = ((by + state.ballSize / 2) - (nextCpuY + state.paddleH / 2)) / (state.paddleH / 2);
    const clampedRel = Math.max(-1, Math.min(1, rel));
    const speed = Math.min(460, Math.hypot(bvx, bvy) * 1.05);
    const bounceAngle = clampedRel * 0.95;
    bvx = -Math.cos(bounceAngle) * speed;
    bvy = Math.sin(bounceAngle) * speed;
    rally += 1;
    maxRally = Math.max(maxRally, rally);
    hitstop = 0.035;
    event = 'paddle';
    impactPoint = { x: bx + state.ballSize, y: by + state.ballSize / 2 };
  }

  // Scoring checks
  if (bx + state.ballSize < 0) {
    const nextCpuScore = state.cpuScore + 1;
    const matchOver = nextCpuScore >= state.winScore;
    const baseNext: PongState = {
      ...state,
      playerY: nextPlayerY,
      cpuY: nextCpuY,
      cpuScore: nextCpuScore,
      maxRally,
      status: matchOver ? 'gameover' : 'playing',
      winner: matchOver ? 'cpu' : null,
    };
    return {
      state: matchOver ? baseNext : resetBall(baseNext, 1, rng),
      event: 'score_cpu',
      impactPoint: { x: 8, y: by },
    };
  }

  if (bx > state.width) {
    const nextPlayerScore = state.playerScore + 1;
    const matchOver = nextPlayerScore >= state.winScore;
    const baseNext: PongState = {
      ...state,
      playerY: nextPlayerY,
      cpuY: nextCpuY,
      playerScore: nextPlayerScore,
      maxRally,
      status: matchOver ? 'gameover' : 'playing',
      winner: matchOver ? 'player' : null,
    };
    return {
      state: matchOver ? baseNext : resetBall(baseNext, -1, rng),
      event: 'score_player',
      impactPoint: { x: state.width - 8, y: by },
    };
  }

  return {
    state: {
      ...state,
      playerY: nextPlayerY,
      cpuY: nextCpuY,
      ballX: bx,
      ballY: by,
      ballVx: bvx,
      ballVy: bvy,
      rally,
      maxRally,
      hitstop,
    },
    event,
    impactPoint,
  };
}
