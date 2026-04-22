import type { ConfigBaseProps } from "./config.base";

/**
 * Development overrides.
 *
 * On a physical device reached over Tailnet, swap `archiveBaseUrl` to the
 * Mac's Tailscale IP (`http://100.x.y.z:8765`). The simulator runs on the
 * Mac itself so localhost works as-is.
 */
const DevConfig: Partial<ConfigBaseProps> = {
  archiveBaseUrl: "http://localhost:8765",
};

export default DevConfig;
