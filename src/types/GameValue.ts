import { ValueType, ValueTypes } from './ValueType';
import WithMetadata from './WithMetadata';
import WithId from './WithId';

type BaseGameValue = WithMetadata & WithId;

///////////////////////////////////////////////////////////////////////////////

export type BasicGameValue = BaseGameValue & {
  type: ValueTypes[keyof Omit<ValueTypes, 'LIST' | 'DICTIONARY'>];
};

export type ListGameValue = BaseGameValue & {
  type: ValueTypes['LIST'];

  elementType: ValueTypes;
};

export type DictionaryGameValue = BaseGameValue & {
  type: ValueTypes['DICTIONARY'];

  /**
   * Type of the keys stored in the dictionary
   */
  keyType: ValueType;

  /**
   * Type of the values stored in the dictionary
   */
  valueType: ValueType;
};

///////////////////////////////////////////////////////////////////////////////

type GameValue = BasicGameValue | ListGameValue | DictionaryGameValue;

export default GameValue;
