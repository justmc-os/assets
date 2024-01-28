import { promises as fs } from 'fs';
import path from 'path';

import { info, success } from './common';

const content = `
import ActionsData from './ActionsData';
import EventsData from './EventsData';
import GameValuesData from './GameValuesData';

export * from './types/Action';
export { default as Action } from './types/Action';
export * from './types/ActionArgument';
export { default as ActionArgument } from './types/ActionArgument';
export * from './types/Event';
export { default as Event } from './types/Event';
export * from './types/GameValue';
export { default as GameValue } from './types/GameValue';
export * from './types/ValueType';

export * from './ActionsData';
export { default as ActionsData } from './ActionsData';
export * from './EventsData';
export { default as EventsData } from './EventsData';
export * from './GameValuesData';
export { default as GameValuesData } from './GameValuesData';

// @ts-ignore
import actionsData from '../data/actions.json';

// @ts-ignore
import eventsData from '../data/events.json';

// @ts-ignore
import gameValuesData from '../data/game_values.json';

export const actions = actionsData as ActionsData;
export const events = eventsData as EventsData;
export const gameValues = gameValuesData as GameValuesData;
`.trim();

(async () => {
  info('generating index.ts...');

  await fs.writeFile(path.resolve(__dirname, '../src/index.ts'), content);

  success('generated index.ts');
})();
