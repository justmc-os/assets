import { promises as fs } from 'fs';
import path from 'path';

import {
  info,
  success,
  toPrettyPrintJson,
  CACHE_TRIGGERS_FILE,
  EVENTS_FILE,
  removeComments,
  CachedIcon,
  error,
  matches,
  EVENT_ICONS_CACHE_FILE,
  TRIGGER_MENUS_CACHE_DIR,
  Dictionary,
  PATCHES_DIR,
  warn,
} from './common';

///////////////////////////////////////////////////////////////////////////////

const EVENTS_PATCHES_FILE = path.resolve(PATCHES_DIR, 'events.json');

const MENU_TRIGGERS =
  /(?<!\.)trigger\(\s*Triggers\.(.*?),(.*?)(?=trigger|open|subcategory)/gms;

const MENU_TRIGGER_MATERIAL = /Material.(.*?)\s*(?:\,|\))/;
const WORK_WITH_KEYS = /workWithKeys\s*=\s*(.*?)\)/;
const ADDITIONAL_INFO_KEYS = /additionalInfoKeys\s*=\s*(.*?)\)/;
const MENU_TRIGGER_CATEGORY = /creative_plus.category.(.*)_event/;
const STRING = /"(.*?)"/gms;

type EventMenuIcon = CachedIcon & {
  category: string;
  cancellable: boolean;
  worksWith: string[];
  additionalInfo: string[];
};

const getStrings = (content: string, regex: RegExp) =>
  matches(content.match(regex)?.[1] || '', STRING).map(([, key]) => key);

const extractTriggerMenuIcons = (
  triggerMenuFile: string,
  patches: Dictionary
) => {
  const category = triggerMenuFile.match(MENU_TRIGGER_CATEGORY)?.[1] || null;

  return matches(triggerMenuFile, MENU_TRIGGERS).reduce<
    Dictionary<EventMenuIcon>
  >((acc, [, name, iconPart]) => {
    const match = iconPart.match(MENU_TRIGGER_MATERIAL);
    if (!match) {
      error(`Could not extract icon metadata for trigger: ${name}`);
      return acc;
    }

    const [, material] = match;
    const hasGlint = iconPart.includes('addUnsafeEnchantment');
    const cancellable = iconPart.includes('true');
    const worksWith = getStrings(iconPart, WORK_WITH_KEYS);
    const additionalInfo = getStrings(iconPart, ADDITIONAL_INFO_KEYS);
    const id = name.toLowerCase();
    const patch = patches[id];

    return {
      ...acc,
      [name]: {
        id,
        type: 'event',
        material,
        amount: 1,
        hasGlint,
        category,
        cancellable,
        worksWith,
        additionalInfo,
        ...(patch ? patch.icon : {}),
      },
    };
  }, {});
};

///////////////////////////////////////////////////////////////////////////////

const REGISTERED_EVENT_REGEX = /val\s*(.*?)\s*=\s*register.*\("(.*)"\)/g;

(async () => {
  info('caching event icons...');

  const triggerMenuFiles = await fs.readdir(TRIGGER_MENUS_CACHE_DIR);

  const patches: Dictionary = JSON.parse(
    await fs.readFile(EVENTS_PATCHES_FILE, 'utf-8')
  );

  let icons: Dictionary<EventMenuIcon> = {};
  await Promise.all(
    triggerMenuFiles.map(async (file) => {
      const triggersMenuFile = removeComments(
        await fs.readFile(path.resolve(TRIGGER_MENUS_CACHE_DIR, file), 'utf-8')
      );

      icons = {
        ...icons,
        ...extractTriggerMenuIcons(triggersMenuFile, patches),
      };
    })
  );

  /////////////////////////////////////////////////////////////////////////////

  info('extracting events...');

  const triggers = removeComments(
    await fs.readFile(CACHE_TRIGGERS_FILE, 'utf-8')
  );

  const events = Array.from(triggers.matchAll(REGISTERED_EVENT_REGEX))
    .map(([, name, id]) => [name, id])
    .filter(([, id]) => !id.includes('dummy'))
    .map(([name, id]) => {
      let icon = icons[name];

      if (!icon) {
        const patch = patches[id];
        if (patch && patch.icon) {
          icon = patch.icon;
        } else {
          warn('Not found icon for event', id);
          return { id };
        }
      }

      icon.id = id;
      return {
        id,
        category: icon.category,
        cancellable: icon.cancellable,
        ...(icon.worksWith?.length ? { worksWith: icon.worksWith } : {}),
        ...(icon.additionalInfo?.length
          ? { worksWith: icon.additionalInfo }
          : {}),
      };
    });

  await fs.writeFile(EVENT_ICONS_CACHE_FILE, toPrettyPrintJson(icons));

  success('cached event icons');

  await fs.writeFile(EVENTS_FILE, toPrettyPrintJson(events));

  success('extracted events');
})();
