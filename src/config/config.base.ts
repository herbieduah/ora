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
  /** Archive FastAPI base URL. Simulator/LAN: localhost. Device over Tailnet: Tailscale IP. */
  archiveBaseUrl: string;
  /** Archive reachability probe interval (ms) when the sync queue has pending items. */
  archiveReachabilityProbeMs: number;
}

const BaseConfig: ConfigBaseProps = {
  catchErrors: "always",
  archiveBaseUrl: "http://localhost:8765",
  archiveReachabilityProbeMs: 15_000,
};

export default BaseConfig;
