import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export const toPrettyPrintJson = (value: any) => JSON.stringify(value, null, 2);

export const matches = (input: string, regexp: RegExp) =>
  Array.from(input.matchAll(regexp));

const COMMENT_REGEX = /\/\/.*/g;

export const removeComments = (contents: string) =>
  contents.replace(COMMENT_REGEX, '');

export type Dictionary<T = Record<any, any>> = {
  [key: string]: T;
};

export type CachedIconType = 'game_value' | 'event' | 'action';
export type CachedIcon = {
  id: string;
  type: CachedIconType;
  material: string;
  amount: number;
  hasGlint: boolean;
};

export const fileExists = async (path: string) =>
  !!(await fs.promises.stat(path).catch((e) => false));

///////////////////////////////////////////////////////////////////////////////

export const success = (...args: any[]) =>
  console.log(chalk.green('success'), ...args);

export const info = (...args: any[]) =>
  console.log(chalk.blue('info'), ...args);

export const warn = (...args: any[]) =>
  console.log(chalk.yellow('warn'), ...args);

let shouldExit = false;
export const error = (...args: any[]) => {
  shouldExit = true;
  console.log(chalk.red('error'), ...args);
  return void 0 as never;
};

export const exitIfAnyErrors = () => {
  if (shouldExit) process.exit(1);
};

///////////////////////////////////////////////////////////////////////////////

export const CACHE_DIR = path.resolve(__dirname, '../.cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

export const ACTIONS_DIR = path.resolve(CACHE_DIR, 'actions');
if (!fs.existsSync(ACTIONS_DIR)) fs.mkdirSync(ACTIONS_DIR);

export const CACHE_TRIGGERS_FILE = path.resolve(CACHE_DIR, 'Triggers.kt');
export const CACHE_GAME_VALUES_FILE = path.resolve(CACHE_DIR, 'GameValues.kt');
export const CACHE_GAME_VALUES_MENU_FILE = path.resolve(
  CACHE_DIR,
  'GameValuesMenu.kt'
);

///////////////////////////////////////////////////////////////////////////////

export const MENU_CACHE_DIR = path.resolve(CACHE_DIR, 'menu');
if (!fs.existsSync(MENU_CACHE_DIR)) fs.mkdirSync(MENU_CACHE_DIR);

export const ACTION_MENUS_CACHE_DIR = path.resolve(MENU_CACHE_DIR, 'actions');
if (!fs.existsSync(ACTION_MENUS_CACHE_DIR))
  fs.mkdirSync(ACTION_MENUS_CACHE_DIR);

export const TRIGGER_MENUS_CACHE_DIR = path.resolve(MENU_CACHE_DIR, 'triggers');
if (!fs.existsSync(TRIGGER_MENUS_CACHE_DIR))
  fs.mkdirSync(TRIGGER_MENUS_CACHE_DIR);

///////////////////////////////////////////////////////////////////////////////

export const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

export const EVENTS_FILE = path.resolve(DATA_DIR, 'events.json');
export const GAME_VALUES_FILE = path.resolve(DATA_DIR, 'game_values.json');
export const ACTIONS_FILE = path.resolve(DATA_DIR, 'actions.json');

///////////////////////////////////////////////////////////////////////////////

export const ICONS_CACHE_DIR = path.resolve(CACHE_DIR, 'icons');
if (!fs.existsSync(ICONS_CACHE_DIR)) fs.mkdirSync(ICONS_CACHE_DIR);
export const GAME_VALUE_ICONS_CACHE_FILE = path.resolve(
  ICONS_CACHE_DIR,
  'game_values.json'
);
export const EVENT_ICONS_CACHE_FILE = path.resolve(
  ICONS_CACHE_DIR,
  'events.json'
);
export const ACTION_ICONS_CACHE_FILE = path.resolve(
  ICONS_CACHE_DIR,
  'actions.json'
);

export const ICONS_DIR = path.resolve(__dirname, '../icons');
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR);

export const OUTPUT_FILE = path.resolve(__dirname, '../src/index.ts');

///////////////////////////////////////////////////////////////////////////////

export const PATCHES_DIR = path.resolve(__dirname, '../patches');
if (!fs.existsSync(PATCHES_DIR)) {
  fs.mkdirSync(PATCHES_DIR);
  error('No patches dir found!');
}
