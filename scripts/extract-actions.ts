import { promises as fs } from 'fs';
import chalk from 'chalk';
import path from 'path';

import {
  ACTIONS_DIR,
  PATCHES_DIR,
  error,
  exitIfAnyErrors,
  info,
  removeComments,
  success,
  Dictionary,
  ACTIONS_FILE,
  toPrettyPrintJson,
  matches,
  CachedIcon,
  ACTION_MENUS_CACHE_DIR,
  ACTION_ICONS_CACHE_FILE,
  warn,
} from './common';

import { naiveActionTypeFromId } from '../src/Action';
import ActionArgument, {
  ActionArgumentTypes,
  argumentTypeFromInternal,
  NumberActionArgumentSize,
} from '../src/ActionArgument';

///////////////////////////////////////////////////////////////////////////////

const ACTIONS_PATCHES_FILE = path.resolve(PATCHES_DIR, 'actions.json');
const ENUMS_PATCHES_FILE = path.resolve(PATCHES_DIR, 'enums.json');

const ACTION_NAME = /object\s*(.*?)\s*:.*?"(.*?)"/gms;

const ARGUMENT =
  /by ([a-z]*)(List)?<?([\w]*)>?\("(.*?)"(?:(?:,\s*(false))|(?:.*))\)\s*{((?:.|\n)*?)}/gm;

const ARGUMENT_VALUE_SLOTS = /parsing\s*=\s*(.*)/;
const ARGUMENT_DESCRIPTION_SLOTS = /descriptions?\s*=\s*(.*)/;
const SLOTS = /(?:\(?([\d]+)\.\.([\d]+)\)?)|([\d]+)/g;

const ENUM_REGEX =
  /enum\s*?class\s*(.*?)(?:\(.*?\))?\s*\{(.*?)\}(?!\s*\)|,)/gms;
const ENUM_MEMBER_REGEX =
  /(?:(?:^|,)\s*)(?:\b(?!ItemStack|BlockDirection)([A-Z_][\w]*)(?!\))\b(?:\(.*?\))?)/gm;

type Enums = Dictionary<string[]>;

///////////////////////////////////////////////////////////////////////////////

const MENU_ACTIONS =
  /(?<!\.)action\(\s*(.*?),(.*?)(?=action|open|subcategory)/gms;

const MENU_ACTION_MATERIAL = /Material.(.*?)\s*(?:\,|\))/;
const WORK_WITH_KEYS = /workWithKeys\s*=\s*(.*?)\)/;
const ADDITIONAL_INFO_KEYS = /additionalInfoKeys\s*=\s*(.*?)\)/;
const STRING = /"(.*?)"/gms;

type ActionMenuIcon = CachedIcon & {
  worksWith: string[];
  additionalInfo: string[];
};

const getStrings = (content: string, regex: RegExp) =>
  matches(content.match(regex)?.[1] || '', STRING).map(([, key]) => key);

const extractActionMenuIcons = (actionMenuFile: string) => {
  return matches(actionMenuFile, MENU_ACTIONS).reduce<
    Dictionary<ActionMenuIcon>
  >((acc, [, name, iconPart]) => {
    const match = iconPart.match(MENU_ACTION_MATERIAL);
    if (!match) {
      error(`Couldn't extract icon metadata for action: ${name}`);
      return acc;
    }

    const [, material] = match;
    const hasGlint = iconPart.includes('addUnsafeEnchantment');
    const worksWith = getStrings(iconPart, WORK_WITH_KEYS);
    const additionalInfo = getStrings(iconPart, ADDITIONAL_INFO_KEYS);

    return {
      ...acc,
      [name]: {
        id: name.toLowerCase(),
        type: 'action',
        material,
        amount: 1,
        hasGlint,
        worksWith,
        additionalInfo,
      },
    };
  }, {});
};

///////////////////////////////////////////////////////////////////////////////

const getSlots = (content: string) => {
  return matches(content, SLOTS).reduce<number[]>(
    (acc, [_, number, other, single]) => {
      if (single) return [...acc, +single];
      const slotsInRange = Array(+other - +number + 1)
        .fill(null)
        .map((_, i) => +number + i);

      return [...acc, ...slotsInRange];
    },
    []
  );
};

const getEnums = (content: string) => {
  const enumMatches = matches(content, ENUM_REGEX);

  const enums = enumMatches.reduce<Enums>((acc, [, name, body]) => {
    acc[name] = matches(body.split(';')[0], ENUM_MEMBER_REGEX).map(
      ([, match]) => match
    );

    return acc;
  }, {});

  return enums;
};

const getArguments = (
  action: string,
  enums: Enums,
  args: Dictionary,
  content: string
) => {
  const _args = matches(content, ARGUMENT);
  const _enums: Enums = { ...getEnums(content), ...enums };

  return _args.map<ActionArgument>(
    ([_, type, plural, enumName, id, bool, body]) => {
      const argumentType = argumentTypeFromInternal(type);
      if (!argumentType)
        return error(
          `Unknown action argument type ${chalk.cyan(type)} in action ${action}`
        );

      const _valueSlots = body.match(ARGUMENT_VALUE_SLOTS)?.[1];
      if (!_valueSlots)
        return error(
          `Couldn't get value slots of argument ${chalk.cyan(
            id
          )} in action ${action}`
        );
      const valueSlots = getSlots(_valueSlots);

      if (argumentType === ActionArgumentTypes.ENUM) {
        const values = _enums[type === 'boolean' ? 'Boolean' : enumName];
        if (!values)
          return error(
            `Couldn't get values of enum argument ${chalk.cyan(
              enumName
            )} in action ${action}`
          );

        return {
          id,
          plural: false,
          type: argumentType,
          valueSlots,
          values,
          ...(bool ? { defaultValue: bool } : {}),
          ...args[id],
        };
      }

      const _descriptionSlots = body.match(ARGUMENT_DESCRIPTION_SLOTS)?.[1];
      if (!_descriptionSlots)
        return error(
          `Couldn't get description slots of argument ${chalk.cyan(
            id
          )} in action ${action}`
        );
      const descriptionSlots = getSlots(_descriptionSlots);

      if (argumentType === ActionArgumentTypes.NUMBER) {
        return {
          id,
          plural: false,
          type: argumentType,
          valueSlots,
          descriptionSlots,
          size: type as NumberActionArgumentSize,
          ...args[id],
        };
      }

      if (argumentType === ActionArgumentTypes.LIST) {
        if (!args[id] || !('elementType' in args[id]))
          return error(
            `Coudln't find required ${chalk.yellow(
              'element type'
            )} of array argument ${chalk.cyan(id)} in action ${action}`
          );

        return {
          id,
          plural: false,
          type: argumentType,
          valueSlots,
          descriptionSlots,
          elementType: args[id].elementType,
          ...args[id],
        };
      }

      if (argumentType === ActionArgumentTypes.DICTIONARY) {
        if (!args[id] || !('keyType' in args[id]) || !('valueType' in args[id]))
          return error(
            `Coudln't find required ${chalk.yellow(
              'key and value types'
            )} of dictionary argument ${chalk.cyan(id)} in action ${action}`
          );

        return {
          id,
          plural: false,
          type: argumentType,
          valueSlots,
          descriptionSlots,
          keyType: args[id].keyType,
          valueType: args[id].valueType,
          ...args[id],
        };
      }

      const argument: ActionArgument = {
        id,
        plural: !!plural,
        type: argumentType,
        valueSlots,
        descriptionSlots,
        ...args[id],
      };

      return argument;
    }
  );
};

///////////////////////////////////////////////////////////////////////////////

(async () => {
  info('caching action icons...');

  const actionMenuFiles = await fs.readdir(ACTION_MENUS_CACHE_DIR);

  let icons: Dictionary<ActionMenuIcon> = {};
  await Promise.all(
    actionMenuFiles.map(async (file) => {
      const actionsMenuFile = removeComments(
        await fs.readFile(path.resolve(ACTION_MENUS_CACHE_DIR, file), 'utf-8')
      );

      icons = { ...icons, ...extractActionMenuIcons(actionsMenuFile) };
    })
  );

  exitIfAnyErrors();

  success('cached action icons');

  info('extracting actions...');

  const actionFiles = await fs.readdir(ACTIONS_DIR);

  /////////////////////////////////////////////////////////////////////////////

  const patches: Dictionary = JSON.parse(
    await fs.readFile(ACTIONS_PATCHES_FILE, 'utf-8')
  );

  const enums: Enums = JSON.parse(
    await fs.readFile(ENUMS_PATCHES_FILE, 'utf-8')
  );

  const actions = await Promise.all(
    actionFiles.map(async (file) => {
      const contents = removeComments(
        await fs.readFile(path.resolve(ACTIONS_DIR, file), 'utf-8')
      );

      const ni = matches(contents, ACTION_NAME)[0];
      if (!ni) return error(`Couldn't find action in file: ${file}`);
      const [, name, id] = ni;
      const patch = patches[id];

      if (!icons[name]) {
        if (!patch || !('icons' in patch))
          return warn(`Couldn't find ${chalk.cyan('icon')} for action: ${id}`);

        icons[name] = patch.icons;
      } else icons[name].id = id;

      const ct = naiveActionTypeFromId(id);
      if (!ct) return error(`Couldn't find category for action: ${id}`);
      const [category, type] = ct;

      return {
        id,
        category,
        type,
        args: getArguments(id, enums, patch?.['args'] || {}, contents),
        ...patch,
      };
    })
  );

  exitIfAnyErrors();

  await fs.writeFile(ACTION_ICONS_CACHE_FILE, toPrettyPrintJson(icons));

  await fs.writeFile(ACTIONS_FILE, toPrettyPrintJson(actions));

  success('extracted actions');
})();
