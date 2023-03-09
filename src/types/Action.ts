import ActionArgument from './ActionArgument';
import WithMetadata from './WithMetadata';
import {
  ActionCategories,
  ActionCategory,
  actionCategoryFromId,
} from '../ActionsData';

export const ActionTypes = {
  /**
   * Basic action with arguments
   */
  BASIC: 'basic',

  /**
   * Action WITHOUT arguments that executes a conditional operation
   */
  BASIC_WITH_CONDITIONAL: 'basic_with_conditional',

  /**
   * Action with arguments containing other actions in the brackets that follow
   */
  CONTAINER: 'container',

  /**
   * Action WITHOUT arguments containing other actions in the brackets that follow
   * that only executes child operations if the given condition is true
   */
  CONTAINER_WITH_CONDITIONAL: 'container_with_conditional',
} as const;

type ActionTypes = typeof ActionTypes;
type ActionType = ActionTypes[keyof ActionTypes];

export const naiveActionTypeFromId = (
  id: string
): [ActionCategory, ActionType] | undefined => {
  const category = actionCategoryFromId(id);
  if (!category) return undefined;

  if (category === ActionCategories.IF_PLAYER)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.IF_ENTITY)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.IF_GAME)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.IF_VARIABLE)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.ELSE)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.CONTROLLER)
    return [category, ActionTypes.CONTAINER];

  if (category === ActionCategories.REPEAT)
    return [category, ActionTypes.CONTAINER];

  return [category, ActionTypes.BASIC];
};

///////////////////////////////////////////////////////////////////////////////

type BaseAction = WithMetadata & {
  id: string;
  category: ActionCategory;
};

type ActionWithArguments = BaseAction & {
  /**
   * Array of arguments that can be supplied to the action
   */
  args: ActionArgument[];
};

type BasicAction = ActionWithArguments & {
  type: ActionTypes['BASIC'];
};

type BasicWithConditionalAction = BaseAction & {
  type: ActionTypes['BASIC_WITH_CONDITIONAL'];
};

type ContainerAction = ActionWithArguments & {
  type: ActionTypes['CONTAINER'];
};

type ContainerWithConditionalAction = BaseAction & {
  type: ActionTypes['CONTAINER_WITH_CONDITIONAL'];
};

///////////////////////////////////////////////////////////////////////////////

type Action =
  | BasicAction
  | BasicWithConditionalAction
  | ContainerAction
  | ContainerWithConditionalAction;

export default Action;
