import Action from './Action';
import ActionArgument, {
  ActionArgumentType,
  ActionArgumentTypes,
  WithDefaultValue,
} from './ActionArgument';

// type ExcludeKeysWithValue<T, V> = {
//   [K in keyof T]: T[K] extends V ? never : K;
// }[keyof T];

// type ExcludeValues<T, V> = Pick<T, ExcludeKeysWithValue<T, V>>;

// type GetArgumentByType<U extends ActionArgumentType> = Extract<
//   ActionArgument,
//   { type: U }
// >;

// type GetDefaultValue<T> = T extends WithDefaultValue<infer V> ? V : never;

// export type Argument2DefaultValueMap = ExcludeValues<
//   {
//     [K in Exclude<
//       ActionArgumentType,
//       ActionArgumentTypes['ENUM']
//     >]: GetDefaultValue<GetArgumentByType<K>>;
//   },
//   never
// >;

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

export const actionCategoryFromId = (
  id: string
): ActionCategory | undefined => {
  return Object.values(ActionCategories).find((category) =>
    id.startsWith(category)
  );
};

// type ActionsData = {
// defaultValues: Argument2DefaultValueMap;
type ActionsData = Record<ActionCategory, Action[]>;
// };

export default ActionsData;
