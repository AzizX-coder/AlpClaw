export { ConfigSchema, type AlpClawConfig } from "./schema.js";
export { loadConfig, type AlpClawConfigOverrides } from "./loader.js";
export {
  readGlobalConfig,
  writeGlobalConfig,
  setGlobalValue,
  setApiKey,
  setBotCredential,
  applyPreset,
  globalConfigPath,
  globalConfigDir,
  legacyConfigDir,
  runsDir,
  logsDir,
  type GlobalConfigShape,
} from "./global-store.js";
