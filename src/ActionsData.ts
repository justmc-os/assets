import Action from './Action';

export const ActionCategories = {
  PLAYER: 'player',
  IF_PLAYER: 'if_player',

  ENTITY: 'entity',
  IF_ENTITY: 'if_entity',

  GAME: 'game',
  IF_GAME: 'if_game',

  CONTROL: 'control',
  CONTROLLER: 'controller',

  SET_VARIABLE: 'set_variable',
  IF_VARIABLE: 'if_variable',

  SELECT: 'select',
  REPEAT: 'repeat',
  ELSE: 'else',
  CALL_FUNCTION: 'call_function',
  START_PROCESS: 'start_process',
  EMPTY: 'empty',
} as const;

export type ActionCategories = typeof ActionCategories;
export type ActionCategory = ActionCategories[keyof ActionCategories];

const CATEGORIES = [
  ActionCategories.CONTROLLER,
  ...Object.values(ActionCategories).filter(
    (c) => c != ActionCategories.CONTROLLER
  ),
];

export const actionCategoryFromId = (
  id: string
): ActionCategory | undefined => {
  return CATEGORIES.find((category) => id.startsWith(category));
};

type ActionsData = Record<ActionCategory, Action[]>;

export default ActionsData;
