import { promises as fs } from 'fs';
import chalk from 'chalk';
import path from 'path';

import {
  info,
  success,
  toPrettyPrintJson,
  GAME_VALUES_FILE,
  CACHE_GAME_VALUES_FILE,
  removeComments,
  CACHE_GAME_VALUES_MENU_FILE,
  matches,
  error,
  PATCHES_DIR,
  exitIfAnyErrors,
  Dictionary,
  CachedIcon,
  GAME_VALUE_ICONS_CACHE_FILE,
} from './common';

import { ValueTypes, valueTypeFromInternal } from '../src/types/ValueType';
import GameValue from '../src/types/GameValue';

///////////////////////////////////////////////////////////////////////////////

const GAME_VALUES_PATCHES_FILE = path.resolve(PATCHES_DIR, 'game_values.json');

const MENU_GAME_VALUES =
  /(?<!\.)addGameValue\(\s*GameValues\.(.*?),(.*?)(?=add(?:G|Q))/gms;

const MENU_GAME_VALUE_MATERIAL =
  /ItemStack\(Material\.(.*?)(?:\s*,\s*(\d+)\s*\)|\))/;
const STRING = /"(.*?)"/gms;

type GameValueMenuIcon = CachedIcon & {
  worksWith: string[];
};

const extractGameValueMenuIcons = (
  gameValueMenuFile: string,
  patches: Dictionary
) => {
  return matches(gameValueMenuFile, MENU_GAME_VALUES).reduce<
    Dictionary<GameValueMenuIcon>
  >((acc, [, name, iconPart]) => {
    const match = iconPart.match(MENU_GAME_VALUE_MATERIAL);
    if (!match) {
      error(`Could not extract icon metadata for game value: ${name}`);
      return acc;
    }

    const [, material, amount] = match;
    const hasGlint = iconPart.includes('addUnsafeEnchantment');
    const worksWith = matches(iconPart, STRING).map(([, key]) => key);
    const id = name.toLowerCase();
    const patch = patches[id];

    return {
      ...acc,
      [name]: {
        id,
        type: 'game_value',
        material,
        amount: +amount || 1,
        hasGlint,
        worksWith,
        ...(patch ? patch.icon : {}),
      },
    };
  }, {});
};

///////////////////////////////////////////////////////////////////////////////

const REGISTERED_GAME_VALUES =
  /val\s*(.*?)\s*=\s*register\("(.*)",\s*ValueTypes.([\w]*)/g;

(async () => {
  info('caching game value icons...');

  const gameValuesMenuFile = removeComments(
    await fs.readFile(CACHE_GAME_VALUES_MENU_FILE, 'utf-8')
  );

  const patches: Dictionary = JSON.parse(
    await fs.readFile(GAME_VALUES_PATCHES_FILE, 'utf-8')
  );

  const menuIcons = extractGameValueMenuIcons(gameValuesMenuFile, patches);
  await fs.writeFile(GAME_VALUE_ICONS_CACHE_FILE, toPrettyPrintJson(menuIcons));

  success('cached game value icons');

  info('extracting game values...');

  const gameValuesFile = removeComments(
    await fs.readFile(CACHE_GAME_VALUES_FILE, 'utf-8')
  );

  const registeredGameValues = matches(
    gameValuesFile,
    REGISTERED_GAME_VALUES
  ).map(([, name, id, _type]) => {
    const type = valueTypeFromInternal(_type);
    if (!type) error(`Unknown internal type: ${_type}`);

    return {
      id,
      name,
      type: type!,
    };
  });

  exitIfAnyErrors();

  /////////////////////////////////////////////////////////////////////////////

  const gameValues = registeredGameValues.map((_gameValue) => {
    const icon = menuIcons[_gameValue.name];
    if (!icon)
      error(`Could not find menu icon for game value: ${_gameValue.id}`);

    let gameValue = {
      id: _gameValue.id,
      type: _gameValue.type,
      ...(icon.worksWith.length ? { worksWith: icon.worksWith } : {}),
    } as GameValue;

    const patch = patches[_gameValue.id];
    if (patch) {
      const { icon, ..._patch } = patch;
      gameValue = { ...gameValue, ...patch };
    }

    if (gameValue.type === ValueTypes.DICTIONARY)
      if (!gameValue.keyType || !gameValue.valueType)
        return error(
          `Coudln't find required ${chalk.red(
            'key and value types'
          )} for dictionary game value: ${gameValue.id}`
        );

    if (gameValue.type === ValueTypes.LIST)
      if (!gameValue.elementType)
        return error(
          `Coudln't find required ${chalk.red(
            'element type'
          )} for list game value: ${gameValue.id}`
        );

    return gameValue;
  });

  await fs.writeFile(GAME_VALUES_FILE, toPrettyPrintJson(gameValues));

  exitIfAnyErrors();

  success('extracted game values');
})();
