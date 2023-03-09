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

export const actions: ActionsData = require('./data/actions.json');
export const events: EventsData = require('./data/events.json');
export const gameValues: GameValuesData = require('./data/game_values.json');

export default {
  actions,
  events,
  gameValues,
};
`.trim();

(async () => {
  info('generating index.ts...');

  await fs.writeFile(path.resolve(__dirname, '../src/index.ts'), content);

  success('generated index.ts');
})();
