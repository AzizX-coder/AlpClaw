export { ConfigSchema, type AlpClawConfig } from "./schema.js";
export { loadConfig, type AlpClawConfigOverrides } from "./loader.js";
export {
  readGlobalConfig,
  writeGlobalConfig,
  setGlobalValue,
  setApiKey,
  setBotCredential,
  globalConfigPath,
  globalConfigDir,
  type GlobalConfigShape,
} from "./global-store.js";
