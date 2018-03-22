export type WithoutFunctions<T> = {
  [P in keyof T]: Exclude<T[P], Function>;
};
