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

export default {
  actions: require('./data/actions.json') as ActionsData,
  events: require('./data/events.json') as EventsData,
  gameValues: require('./data/game_values.json') as GameValuesData,
}
`.trim();

(async () => {
  info('generating index.ts...');

  await fs.writeFile(path.resolve(__dirname, '../src/index.ts'), head);

  success('generated index.ts');
})();
