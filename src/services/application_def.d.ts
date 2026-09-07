export type ParameterDefinition = {
  name: string;
  displayName?: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  allowableValues?: unknown;
};

export type ParameterDefinitions = ParameterDefinition[];
