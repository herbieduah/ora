export type ErrorCatchMode = "always" | "dev" | "prod" | "never";

export function isErrorCatchingEnabled(mode: ErrorCatchMode): boolean {
  return (
    mode === "always" ||
    (mode === "dev" && __DEV__) ||
    (mode === "prod" && !__DEV__)
  );
}

export interface ConfigBaseProps {
  catchErrors: ErrorCatchMode;
}

const BaseConfig: ConfigBaseProps = {
  catchErrors: "always",
};

export default BaseConfig;
