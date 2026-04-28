import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';

// English (EN) Imports
import enActivity from './locales/en/activity.json';
import enAgents from './locales/en/agents.json';
import enApiKeys from './locales/en/api-keys.json';
import enApprovals from './locales/en/approvals.json';
import enBackup from './locales/en/backup.json';
import enChannels from './locales/en/channels.json';
import enChat from './locales/en/chat.json';
import enCliCredentials from './locales/en/cli-credentials.json';
import enCommon from './locales/en/common.json';
import enConfig from './locales/en/config.json';
import enContacts from './locales/en/contacts.json';
import enCron from './locales/en/cron.json';
import enEvents from './locales/en/events.json';
import enHooks from './locales/en/hooks.json';
import enImportExport from './locales/en/import-export.json';
import enLogin from './locales/en/login.json';
import enLogs from './locales/en/logs.json';
import enMcp from './locales/en/mcp.json';
import enMemory from './locales/en/memory.json';
import enNodes from './locales/en/nodes.json';
import enOverview from './locales/en/overview.json';
import enPackages from './locales/en/packages.json';
import enPendingMessages from './locales/en/pending-messages.json';
import enProviders from './locales/en/providers.json';
import enSessions from './locales/en/sessions.json';
import enSetup from './locales/en/setup.json';
import enSidebar from './locales/en/sidebar.json';
import enSkills from './locales/en/skills.json';
import enStorage from './locales/en/storage.json';
import enSystemSettings from './locales/en/system-settings.json';
import enTeams from './locales/en/teams.json';
import enTenants from './locales/en/tenants.json';
import enTools from './locales/en/tools.json';
import enTopbar from './locales/en/topbar.json';
import enTraces from './locales/en/traces.json';
import enTts from './locales/en/tts.json';
import enUsage from './locales/en/usage.json';
import enV3Capabilities from './locales/en/v3-capabilities.json';
import enVault from './locales/en/vault.json';

// Spanish (ES) Imports
import esActivity from './locales/es/activity.json';
import esAgents from './locales/es/agents.json';
import esApiKeys from './locales/es/api-keys.json';
import esApprovals from './locales/es/approvals.json';
import esBackup from './locales/es/backup.json';
import esChannels from './locales/es/channels.json';
import esChat from './locales/es/chat.json';
import esCliCredentials from './locales/es/cli-credentials.json';
import esCommon from './locales/es/common.json';
import esConfig from './locales/es/config.json';
import esContacts from './locales/es/contacts.json';
import esCron from './locales/es/cron.json';
import esEvents from './locales/es/events.json';
import esHooks from './locales/es/hooks.json';
import esImportExport from './locales/es/import-export.json';
import esLogin from './locales/es/login.json';
import esLogs from './locales/es/logs.json';
import esMcp from './locales/es/mcp.json';
import esMemory from './locales/es/memory.json';
import esNodes from './locales/es/nodes.json';
import esOverview from './locales/es/overview.json';
import esPackages from './locales/es/packages.json';
import esPendingMessages from './locales/es/pending-messages.json';
import esProviders from './locales/es/providers.json';
import esSessions from './locales/es/sessions.json';
import esSetup from './locales/es/setup.json';
import esSidebar from './locales/es/sidebar.json';
import esSkills from './locales/es/skills.json';
import esStorage from './locales/es/storage.json';
import esSystemSettings from './locales/es/system-settings.json';
import esTeams from './locales/es/teams.json';
import esTenants from './locales/es/tenants.json';
import esTools from './locales/es/tools.json';
import esTopbar from './locales/es/topbar.json';
import esTraces from './locales/es/traces.json';
import esTts from './locales/es/tts.json';
import esUsage from './locales/es/usage.json';
import esV3Capabilities from './locales/es/v3-capabilities.json';
import esVault from './locales/es/vault.json';

const enMessages = {
  activity: enActivity,
  agents: enAgents,
  'api-keys': enApiKeys,
  approvals: enApprovals,
  backup: enBackup,
  channels: enChannels,
  chat: enChat,
  'cli-credentials': enCliCredentials,
  common: enCommon,
  config: enConfig,
  contacts: enContacts,
  cron: enCron,
  events: enEvents,
  hooks: enHooks,
  'import-export': enImportExport,
  login: enLogin,
  logs: enLogs,
  mcp: enMcp,
  memory: enMemory,
  nodes: enNodes,
  overview: enOverview,
  packages: enPackages,
  'pending-messages': enPendingMessages,
  providers: enProviders,
  sessions: enSessions,
  setup: enSetup,
  sidebar: enSidebar,
  skills: enSkills,
  storage: enStorage,
  'system-settings': enSystemSettings,
  teams: enTeams,
  tenants: enTenants,
  tools: enTools,
  topbar: enTopbar,
  traces: enTraces,
  tts: enTts,
  usage: enUsage,
  'v3-capabilities': enV3Capabilities,
  vault: enVault
};

const esMessages = {
  activity: esActivity,
  agents: esAgents,
  'api-keys': esApiKeys,
  approvals: esApprovals,
  backup: esBackup,
  channels: esChannels,
  chat: esChat,
  'cli-credentials': esCliCredentials,
  common: esCommon,
  config: esConfig,
  contacts: esContacts,
  cron: esCron,
  events: esEvents,
  hooks: esHooks,
  'import-export': esImportExport,
  login: esLogin,
  logs: esLogs,
  mcp: esMcp,
  memory: esMemory,
  nodes: esNodes,
  overview: esOverview,
  packages: esPackages,
  'pending-messages': esPendingMessages,
  providers: esProviders,
  sessions: esSessions,
  setup: esSetup,
  sidebar: esSidebar,
  skills: esSkills,
  storage: esStorage,
  'system-settings': esSystemSettings,
  teams: esTeams,
  tenants: esTenants,
  tools: esTools,
  topbar: esTopbar,
  traces: esTraces,
  tts: esTts,
  usage: esUsage,
  'v3-capabilities': esV3Capabilities,
  vault: esVault
};

// Register locales
addMessages('en', enMessages);
addMessages('en-US', enMessages);
addMessages('es', esMessages);
addMessages('es-ES', esMessages);

const savedLocale = localStorage.getItem('goclaw:language');
const navLocale = getLocaleFromNavigator();

// Log status
console.log("[i18n] Initialization info:", {
    saved: savedLocale,
    navigator: navLocale,
    esConfigSize: Object.keys(esConfig).length,
    enConfigSize: Object.keys(enConfig).length
});

init({
  fallbackLocale: 'en',
  initialLocale: savedLocale || navLocale,
});
