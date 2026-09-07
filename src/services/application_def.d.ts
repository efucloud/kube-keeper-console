export type ParameterDefinition = {
  name: string;
  displayName?: string;
  required: boolean;
  type: 'string' | 'inputString' | 'text' | 'url' | 'password' | 'inputSecret' | 'image' | 'number' | 'inputNumber' | 'bool' | 'stringArray' | 'numberArray' | 'object' | 'float' | 'base64Encode' | 'gitRepo';
  description?: string;
  defaultValue?: unknown;
  allowableValues?: unknown;
};

export type ParameterDefinitions = ParameterDefinition[];
