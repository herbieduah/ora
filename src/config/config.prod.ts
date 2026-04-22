import type { ConfigBaseProps } from "./config.base";

/**
 * Production overrides. TestFlight builds ship with the Tailscale IP so
 * the phone can reach Archive from anywhere that has Tailnet access.
 * Override at build time via EAS secrets if needed.
 */
const ProdConfig: Partial<ConfigBaseProps> = {
  archiveBaseUrl: "http://100.121.181.12:8765",
};

export default ProdConfig;
