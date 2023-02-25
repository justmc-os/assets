import { ValueType, ValueTypes } from './ValueType';

type BaseGameValue = {
  id: string;
  worksWith?: string[];
};

///////////////////////////////////////////////////////////////////////////////

type BasicGameValue = BaseGameValue & {
  type: ValueTypes[keyof Omit<ValueTypes, 'LIST' | 'DICTIONARY'>];
};

type ListGameValue = BaseGameValue & {
  type: ValueTypes['LIST'];

  elementType: ValueTypes;
};

type DictionaryGameValue = BaseGameValue & {
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
