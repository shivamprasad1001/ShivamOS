import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autocompleteTerminalInput,
  executeTerminalCommand,
  navigateHistory,
} from './terminalLogic';

test('help command returns structured reference lines', () => {
  const res = executeTerminalCommand('help');
  assert.ok(res.lines.length >= 6);
  assert.ok(res.lines.some((l) => l.text.includes('whoami')));
  assert.ok(res.lines.some((l) => l.text.includes('open <target>')));
});

test('whoami prints Shivam profile details', () => {
  const res = executeTerminalCommand('whoami');
  assert.ok(res.lines.some((l) => l.text.includes('shivam')));
  assert.ok(res.lines.some((l) => l.text.includes('NITRA')));
});

test('ls projects lists all five verified portfolio projects', () => {
  const res = executeTerminalCommand('ls projects');
  const joined = res.lines.map((l) => l.text).join('\n');
  assert.match(joined, /OrchestratorFlow\.app/);
  assert.match(joined, /gwen_rag\.exe/);
  assert.match(joined, /MiniGPT\.py/);
  assert.match(joined, /textile_defect\.app/);
  assert.match(joined, /yolo-custom-trainer\.app/);
  assert.match(joined, /88% success rate/);
});

test('open commands map to correct window IDs including games and tools', () => {
  assert.equal(executeTerminalCommand('open resume').openWindow, 'resume');
  assert.equal(executeTerminalCommand('open orchestratorflow').openWindow, 'project-orchestratorflow');
  assert.equal(executeTerminalCommand('open textile-defect').openWindow, 'project-textile-defect');
  assert.equal(executeTerminalCommand('open yolov8').openWindow, 'project-yolov8');
  assert.equal(executeTerminalCommand('open mini-gpt').openWindow, 'project-minigpt');
  assert.equal(executeTerminalCommand('open gwen').openWindow, 'project-gwen');
  assert.equal(executeTerminalCommand('open games').openWindow, 'games');
  assert.equal(executeTerminalCommand('open snake').openWindow, 'game-snake');
  assert.equal(executeTerminalCommand('open tetris').openWindow, 'game-tetris');
  assert.equal(executeTerminalCommand('open minesweeper').openWindow, 'game-minesweeper');
  assert.equal(executeTerminalCommand('open pong').openWindow, 'game-pong');
  assert.equal(executeTerminalCommand('open paint').openWindow, 'paint');
  assert.equal(executeTerminalCommand('open notes').openWindow, 'notes');
  assert.equal(executeTerminalCommand('contact').openWindow, 'contact');
});

test('ls games and wallpaper commands return expected outputs', () => {
  const gamesRes = executeTerminalCommand('ls games');
  const joined = gamesRes.lines.map((l) => l.text).join('\n');
  assert.match(joined, /snake\.exe/);
  assert.match(joined, /tetris\.exe/);
  assert.match(joined, /minesweeper\.exe/);
  assert.match(joined, /pong\.exe/);

  assert.equal(executeTerminalCommand('wallpaper grid').setWallpaper, 'grid');
  assert.equal(executeTerminalCommand('wallpaper unknown').lines[0]?.kind, 'error');
});

test('clear and unknown commands behave predictably', () => {
  assert.equal(executeTerminalCommand('clear').clear, true);
  const unknown = executeTerminalCommand('foobar');
  assert.equal(unknown.lines[0]?.kind, 'error');
});

test('autocompleteTerminalInput completes matching command prefixes', () => {
  assert.equal(autocompleteTerminalInput('who'), 'whoami');
  assert.equal(autocompleteTerminalInput('open res'), 'open resume');
  assert.equal(autocompleteTerminalInput('wall'), 'wallpaper dither');
  assert.equal(autocompleteTerminalInput('xyz'), 'xyz');
});

test('navigateHistory steps backward and forward through command history', () => {
  const history = ['help', 'ls projects', 'open resume'];
  const s1 = navigateHistory(history, -1, 'up');
  assert.deepEqual(s1, { nextIndex: 2, value: 'open resume' });

  const s2 = navigateHistory(history, s1.nextIndex, 'up');
  assert.deepEqual(s2, { nextIndex: 1, value: 'ls projects' });

  const s3 = navigateHistory(history, s2.nextIndex, 'down');
  assert.deepEqual(s3, { nextIndex: 2, value: 'open resume' });

  const s4 = navigateHistory(history, s3.nextIndex, 'down');
  assert.deepEqual(s4, { nextIndex: -1, value: '' });
});
