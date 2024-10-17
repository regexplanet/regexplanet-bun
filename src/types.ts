

export type TestInput = {
  engine: string;
  regex: string;
  replacement: string;
  extras?: string[];
  option: string[];
  inputs: string[];
};

export type TestOutput = {
  success: boolean;
  html?: string;
  message?: string;
};