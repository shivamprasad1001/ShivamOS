import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SETTINGS_STORAGE_KEY,
  getExplorerItems,
  getExplorerPath,
  loadSystemSettings,
  pushRecentWindow,
  resolveProperties,
  saveSystemSettings,
} from './systemLogic';
import type { StorageLike } from './desktopLogic';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

test('loadSystemSettings and saveSystemSettings persist valid preferences and survive storage errors', () => {
  const storage = createMemoryStorage();
  const custom = {
    wallpaper: 'grid' as const,
    soundEnabled: true,
    crtEnabled: true,
    reduceMotion: true,
  };

  assert.equal(saveSystemSettings(custom, storage), true);
  assert.deepEqual(loadSystemSettings(storage, false), custom);

  // Invalid values fall back safely
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ wallpaper: 'invalid', soundEnabled: 'yes' }));
  assert.deepEqual(loadSystemSettings(storage, false), DEFAULT_SYSTEM_SETTINGS);

  // Corrupted JSON falls back cleanly
  storage.setItem(SETTINGS_STORAGE_KEY, '{broken');
  assert.deepEqual(loadSystemSettings(storage, true), {
    ...DEFAULT_SYSTEM_SETTINGS,
    reduceMotion: true,
  });

  // Throwing storage never crashes
  const broken: StorageLike = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {
      throw new Error('denied');
    },
  };
  assert.equal(saveSystemSettings(custom, broken), false);
  assert.deepEqual(loadSystemSettings(broken, false), DEFAULT_SYSTEM_SETTINGS);
});

test('pushRecentWindow keeps deduplicated MRU list bounded to maxItems', () => {
  let recent = pushRecentWindow([], 'about', 3);
  recent = pushRecentWindow(recent, 'projects', 3);
  recent = pushRecentWindow(recent, 'resume', 3);
  recent = pushRecentWindow(recent, 'projects', 3);
  assert.deepEqual(recent, ['projects', 'resume', 'about']);

  recent = pushRecentWindow(recent, 'settings', 3);
  assert.deepEqual(recent, ['settings', 'projects', 'resume']);
});

test('getExplorerPath and getExplorerItems return only verified content.ts entries', () => {
  assert.equal(getExplorerPath('projects'), 'C:\\SHIVAM\\PROJECTS');
  assert.equal(getExplorerPath('certificates'), 'C:\\SHIVAM\\CERTIFICATES');

  const projects = getExplorerItems('projects');
  assert.deepEqual(
    projects.map((p) => p.name),
    [
      'OrchestratorFlow.app',
      'gwen_rag.exe',
      'MiniGPT.py',
      'textile_defect.app',
      'yolo-custom-trainer.app',
    ]
  );

  const resume = getExplorerItems('resume');
  assert.equal(resume.length, 2);
  assert.equal(resume[0].name, 'SHIVAM_PRASAD_CV_2026.TXT');
  assert.equal(resume[1].name, 'resume.pdf');

  const certs = getExplorerItems('certificates');
  assert.equal(certs.length, 3);
  assert.ok(certs[0].detail?.includes('Campaigning Source Pvt. Ltd.'));
  assert.ok(certs.some((c) => c.name === 'OrchestratorFlow_NGAISL2026.pub'));
});

test('resolveProperties omits unverified modifiedDate and never invents file sizes', () => {
  const orchProps = resolveProperties({ kind: 'project', projectId: 'project-orchestratorflow' });
  assert.ok(orchProps);
  assert.equal(orchProps.name, 'OrchestratorFlow.app');
  assert.equal(orchProps.modifiedDate, undefined);
  assert.equal(orchProps.repoUrl, 'https://github.com/shivamprasad1001/orchestratorflow');

  const textileProps = resolveProperties({ kind: 'project', projectId: 'project-textile-defect' });
  assert.ok(textileProps);
  assert.equal(textileProps.repoUrl, undefined);
  assert.equal(textileProps.modifiedDate, undefined);

  const renamedIcon = resolveProperties(
    { kind: 'desktop-icon', iconId: 'projects' },
    { projects: 'ML Work' }
  );
  assert.ok(renamedIcon);
  assert.equal(renamedIcon.name, 'ML Work');
});
