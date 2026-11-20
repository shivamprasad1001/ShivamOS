export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GridPoint {
  x: number;
  y: number;
}

export interface SnakeState {
  cols: number;
  rows: number;
  snake: GridPoint[];
  direction: Direction;
  directionQueue: Direction[];
  food: GridPoint;
  bonus: { point: GridPoint; ticksLeft: number } | null;
  score: number;
  foodsEaten: number;
  status: 'title' | 'playing' | 'paused' | 'gameover';
}

export const SNAKE_COLS = 20;
export const SNAKE_ROWS = 16;

export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

export function spawnFreeCell(
  cols: number,
  rows: number,
  occupied: GridPoint[],
  rng: () => number = Math.random
): GridPoint | null {
  const blocked = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const free: GridPoint[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!blocked.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return null;
  const idx = Math.floor(rng() * free.length);
  return free[Math.min(idx, free.length - 1)];
}

export function createInitialSnakeState(
  status: SnakeState['status'] = 'title',
  rng: () => number = Math.random
): SnakeState {
  const snake: GridPoint[] = [
    { x: 10, y: 8 },
    { x: 9, y: 8 },
    { x: 8, y: 8 },
  ];
  const food = spawnFreeCell(SNAKE_COLS, SNAKE_ROWS, snake, rng) ?? { x: 15, y: 8 };
  return {
    cols: SNAKE_COLS,
    rows: SNAKE_ROWS,
    snake,
    direction: 'RIGHT',
    directionQueue: [],
    food,
    bonus: null,
    score: 0,
    foodsEaten: 0,
    status,
  };
}

/**
 * Buffers up to 2 valid turns so rapid keystrokes never cause accidental 180-degree self-collisions.
 */
export function queueSnakeDirection(state: SnakeState, nextDir: Direction): SnakeState {
  const lastPlanned =
    state.directionQueue.length > 0
      ? state.directionQueue[state.directionQueue.length - 1]
      : state.direction;

  if (nextDir === lastPlanned || isOppositeDirection(lastPlanned, nextDir)) {
    return state;
  }
  if (state.directionQueue.length >= 2) {
    return state;
  }

  return {
    ...state,
    directionQueue: [...state.directionQueue, nextDir],
  };
}

export interface SnakeStepResult {
  state: SnakeState;
  event: 'none' | 'eat' | 'bonus' | 'crash';
}

export function stepSnake(
  state: SnakeState,
  rng: () => number = Math.random
): SnakeStepResult {
  if (state.status !== 'playing') {
    return { state, event: 'none' };
  }

  const [queuedDir, ...remainingQueue] = state.directionQueue;
  const activeDir = queuedDir ?? state.direction;
  const head = state.snake[0];

  const nextHead: GridPoint = {
    x: head.x + (activeDir === 'RIGHT' ? 1 : activeDir === 'LEFT' ? -1 : 0),
    y: head.y + (activeDir === 'DOWN' ? 1 : activeDir === 'UP' ? -1 : 0),
  };

  // Wall collision
  if (
    nextHead.x < 0 ||
    nextHead.x >= state.cols ||
    nextHead.y < 0 ||
    nextHead.y >= state.rows
  ) {
    return {
      state: { ...state, direction: activeDir, directionQueue: [], status: 'gameover' },
      event: 'crash',
    };
  }

  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const ateBonus =
    state.bonus !== null &&
    nextHead.x === state.bonus.point.x &&
    nextHead.y === state.bonus.point.y;

  // Tail moves forward unless eating regular food
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)) {
    return {
      state: { ...state, direction: activeDir, directionQueue: [], status: 'gameover' },
      event: 'crash',
    };
  }

  const nextSnake = ateFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

  let nextBonus = state.bonus
    ? state.bonus.ticksLeft > 1
      ? { ...state.bonus, ticksLeft: state.bonus.ticksLeft - 1 }
      : null
    : null;

  let nextScore = state.score;
  let nextFoodsEaten = state.foodsEaten;
  let nextFood = state.food;
  let event: SnakeStepResult['event'] = 'none';

  if (ateBonus) {
    nextScore += 30;
    nextBonus = null;
    event = 'bonus';
  }

  if (ateFood) {
    nextScore += 10;
    nextFoodsEaten += 1;
    event = 'eat';

    const occupied = nextBonus ? [...nextSnake, nextBonus.point] : nextSnake;
    const spawnedFood = spawnFreeCell(state.cols, state.rows, occupied, rng);
    if (!spawnedFood) {
      return {
        state: {
          ...state,
          snake: nextSnake,
          direction: activeDir,
          directionQueue: remainingQueue,
          score: nextScore,
          foodsEaten: nextFoodsEaten,
          bonus: null,
          status: 'gameover',
        },
        event: 'eat',
      };
    }
    nextFood = spawnedFood;

    // Spawn golden data-packet bonus every 5 regular foods
    if (nextFoodsEaten % 5 === 0 && !nextBonus) {
      const bonusCell = spawnFreeCell(state.cols, state.rows, [...nextSnake, nextFood], rng);
      if (bonusCell) {
        nextBonus = { point: bonusCell, ticksLeft: 32 };
      }
    }
  }

  return {
    state: {
      ...state,
      snake: nextSnake,
      direction: activeDir,
      directionQueue: remainingQueue,
      food: nextFood,
      bonus: nextBonus,
      score: nextScore,
      foodsEaten: nextFoodsEaten,
    },
    event,
  };
}
