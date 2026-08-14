export type Expression = { 
  mode: string;
  simpleItems: SimpleItem[];
  javascript: string;
  cel?: string;
} ; 
export type SimpleItem = { 
  name?: string;
  value: any;//todo 可能需要手动完善结构;
  operator: string;
} ; 
