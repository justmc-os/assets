import { promises as fs } from 'fs';
import path from 'path';

import { info, success } from './common';

const head = `
import ActionsData from './ActionsData';
import EventsData from './EventsData';
import GameValuesData from './GameValuesData';

export * from './types/Action';
export * from './types/ActionArgument';
export * from './types/Event';
export * from './types/GameValue';
export * from './types/ValueType';

export * from './ActionsData';
export * from './EventsData';
export * from './GameValuesData';

export type Data = {
  actions: ActionsData,
  events: EventsData,
  gameValues: GameValuesData,
}

const data: Data = {
  actions: require('./data/actions.json'),
  events: require('./data/events.json'),
  gameValues: require('./data/game_values.json'),
}

export default data;
`.trim();

(async () => {
  info('generating index.ts...');

  await fs.writeFile(path.resolve(__dirname, '../src/index.ts'), head);

  success('generated index.ts');
})();
