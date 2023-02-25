export const ValueTypes = {
  NUMBER: 'number',
  TEXT: 'text',

  ITEM: 'item',
  BLOCK: 'block',
  LOCATION: 'location',
  VECTOR: 'vector',

  SOUND: 'sound',
  PARTICLE: 'particle',
  POTION: 'potion',

  /**
   * Argument that only accepts variables containing a list
   */
  LIST: 'list',

  /**
   * Argument that only accepts variables containing a dictionary
   */
  DICTIONARY: 'dictionary',
} as const;

export type ValueTypes = typeof ValueTypes;
export type ValueType = ValueTypes[keyof ValueTypes];

export const valueTypeFromInternal = (value: string): ValueType | null => {
  const _value = value.toLowerCase();

  if (_value === 'string') return ValueTypes.TEXT;
  if (_value === 'array') return ValueTypes.LIST;
  if (_value === 'map') return ValueTypes.DICTIONARY;

  if (['int', 'long', 'float', 'double'].includes(_value))
    return ValueTypes.NUMBER;

  if (Object.values<string>(ValueTypes).includes(_value))
    return _value as ValueType;

  return null;
};
