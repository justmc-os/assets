import 'dotenv/config';

import { promises as fs } from 'fs';
import path from 'path';
import { Gitlab } from '@gitbeaker/node';

import {
  CACHE_GAME_VALUES_FILE,
  info,
  success,
  CACHE_TRIGGERS_FILE,
  CACHE_GAME_VALUES_MENU_FILE,
  ACTION_MENUS_CACHE_DIR,
  TRIGGER_MENUS_CACHE_DIR,
  ACTIONS_DIR,
} from './common';

const PROJECT_ID = 21858804;
const API = new Gitlab({
  token: process.env.GITLAB_TOKEN,
  requestTimeout: 10_000,
});

const IGNORED_ACTIONS = ['Actions.kt', 'DummyAction.kt'];
const ACTIONS_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/action';

const IGNORED_ACTION_MENUS = [
  'ActionMenuBuilder.kt',
  'StartProcessMenu.kt',
  'SelectActionMenu.kt',
  'AllConditionalSelectionMenu.kt',
  'EntityConditionalSelectionMenu.kt',
  'PlayerConditionalSelectionMenu.kt',
  'PlayerActionMenu.kt',
  'IfPlayerActionMenu.kt',
  'PlayerActionMenu.kt',
  'GameActionMenu.kt',
  'CallFunctionMenu.kt',
];
const ACTION_MENUS_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/editor/menu/action';

const TRIGGERS_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/core/trigger/Triggers.kt';

const IGNORED_TRIGGER_MENUS = ['TriggerMenu.kt'];
const TRIGGER_MENUS_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/editor/menu/trigger';

const GAME_VALUES_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/core/value/GameValue.kt';

const GAME_VALUES_MENU_PATH =
  'justmc-creative-plus/src/main/kotlin/ru/justmc/creativeplus/editor/menu/gamevalue/GameValuesMenu.kt';

const getFile = async (path: string) => {
  return await API.RepositoryFiles.showRaw(PROJECT_ID, path);
};

(async () => {
  info('creating cache...');
  info('fetching actions...');

  const actionFiles = (
    await API.Repositories.tree(PROJECT_ID, {
      path: ACTIONS_PATH,
      recursive: true,
    })
  ).filter((file) => {
    if (file.type !== 'blob') return false;

    return !IGNORED_ACTIONS.some((ignored) => file.path.endsWith(ignored));
  });

  info('caching actions...');

  await Promise.all(
    actionFiles.map(async (file) => {
      const content = await getFile(file.path);

      return fs.writeFile(path.resolve(ACTIONS_DIR, file.name), content);
    })
  );

  info('fetching action menus...');

  const actionMenuFiles = (
    await API.Repositories.tree(PROJECT_ID, {
      path: ACTION_MENUS_PATH,
      recursive: true,
    })
  ).filter((file) => {
    if (file.type !== 'blob') return false;

    return !IGNORED_ACTION_MENUS.some((ignored) => file.path.endsWith(ignored));
  });

  info('caching action menus...');

  await Promise.all(
    actionMenuFiles.map(async (file) => {
      const content = await getFile(file.path);

      return fs.writeFile(
        path.resolve(ACTION_MENUS_CACHE_DIR, file.name),
        content
      );
    })
  );

  info('caching triggers...');

  await fs.writeFile(CACHE_TRIGGERS_FILE, await getFile(TRIGGERS_PATH));

  info('fetching trigger menus...');

  const triggerMenuFiles = (
    await API.Repositories.tree(PROJECT_ID, {
      path: TRIGGER_MENUS_PATH,
    })
  ).filter((file) => {
    if (file.type !== 'blob') return false;

    return !IGNORED_TRIGGER_MENUS.some((ignored) =>
      file.path.endsWith(ignored)
    );
  });

  info('caching trigger menus...');

  await Promise.all(
    triggerMenuFiles.map(async (file) => {
      const content = await getFile(file.path);

      return fs.writeFile(
        path.resolve(TRIGGER_MENUS_CACHE_DIR, file.name),
        content
      );
    })
  );

  info('caching game values...');

  await fs.writeFile(CACHE_GAME_VALUES_FILE, await getFile(GAME_VALUES_PATH));

  info('caching game values menu...');

  await fs.writeFile(
    CACHE_GAME_VALUES_MENU_FILE,
    await getFile(GAME_VALUES_MENU_PATH)
  );

  success('created cache');
})();
