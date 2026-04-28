const fs = require('fs');

const enPath = '/mnt/Athenea/hakos/claude-nix/go-claw/ui/svelte-v2/src/lib/i18n/locales/en/config.json';
const esPath = '/mnt/Athenea/hakos/claude-nix/go-claw/ui/svelte-v2/src/lib/i18n/locales/es/config.json';

const enMissing = {
  "server.save": "Save Network",
  "server.httpListener": "HTTP Listener",
  "server.httpListenerDesc": "API and Gateway binding",
  "server.hostBind": "Host Bind",
  "server.apiPort": "API Port",
  "server.auth": "Authentication",
  "server.authDesc": "Master access token",
  "server.masterToken": "Master Token",
  "server.tokenRedacted": "Token is redacted. Only overwrite if you want to change it.",
  "server.security": "Security & Access",
  "server.securityDesc": "Allowed cross-origin domains and super-admins",
  "server.ownerDiscordIds": "Owner Discord IDs (Comma separated)",
  "behavior.title": "Behavioral Mechanics",
  "behavior.description": "Core system limits and logging",
  "behavior.save": "Save Mechanics",
  "behavior.scopeGlobal": "Global (Shared)",
  "behavior.scopeUser": "Per-User",
  "behavior.scopeChannel": "Per-Channel",
  "behavior.injBlock": "Block Execution",
  "behavior.injLog": "Log Only",
  "behavior.injWarn": "Warn User",
  "behavior.compactionAction": "Compaction Action",
  "behavior.compSumm": "Summarize",
  "behavior.compTrunc": "Truncate",
  "behavior.compDrop": "Drop Oldest",
  "integrations.title": "Integrations & Hooks",
  "integrations.description": "External services and background workers",
  "integrations.save": "Save Integrations"
};

const esMissing = {
  "server.save": "Guardar Red",
  "server.httpListener": "Servidor HTTP",
  "server.httpListenerDesc": "Enlace de API y Gateway",
  "server.hostBind": "Interfaz (Host Bind)",
  "server.apiPort": "Puerto API",
  "server.auth": "Autenticación",
  "server.authDesc": "Token de acceso maestro",
  "server.masterToken": "Token Maestro",
  "server.tokenRedacted": "El token está oculto. Solo sobrescribe si quieres cambiarlo.",
  "server.security": "Seguridad y Acceso",
  "server.securityDesc": "Dominios cruzados permitidos y super-administradores",
  "server.ownerDiscordIds": "IDs de Discord Propietarios (Separados por coma)",
  "behavior.title": "Mecánicas de Comportamiento",
  "behavior.description": "Límites del sistema principal y registro",
  "behavior.save": "Guardar Mecánicas",
  "behavior.scopeGlobal": "Global (Compartido)",
  "behavior.scopeUser": "Por Usuario",
  "behavior.scopeChannel": "Por Canal",
  "behavior.injBlock": "Bloquear Ejecución",
  "behavior.injLog": "Solo Registrar",
  "behavior.injWarn": "Avisar al Usuario",
  "behavior.compactionAction": "Acción de Compactación",
  "behavior.compSumm": "Resumir",
  "behavior.compTrunc": "Truncar",
  "behavior.compDrop": "Eliminar Antiguos",
  "integrations.title": "Integraciones y Hooks",
  "integrations.description": "Servicios externos y procesos en segundo plano",
  "integrations.save": "Guardar Integraciones"
};

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esObj = JSON.parse(fs.readFileSync(esPath, 'utf8'));

Object.assign(enObj, enMissing);
Object.assign(esObj, esMissing);

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));
fs.writeFileSync(esPath, JSON.stringify(esObj, null, 2));

console.log("Injected missing keys successfully.");
