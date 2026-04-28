import type { AgentData } from "../../../lib/types/agent";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readPromptMode(agent: { other_config?: Record<string, unknown> | null }): string {
  const bag = (agent.other_config ?? {}) as Record<string, unknown>;
  return (bag.prompt_mode as string) || "full";
}

export function agentDisplayName(
  agent: { display_name?: string; agent_key: string },
  unnamedLabel: string,
): string {
  if (agent.display_name) return agent.display_name;
  if (UUID_RE.test(agent.agent_key)) return unnamedLabel;
  return agent.agent_key;
}

export function hasActiveChatGPTOAuthRouting(
  routing?: any,
): boolean {
  let raw: unknown = routing;
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "chatgpt_oauth_routing" in (raw as Record<string, unknown>)
  ) {
    raw = (raw as Record<string, unknown>).chatgpt_oauth_routing;
  }
  if (!raw || typeof raw !== "object") {
    return false;
  }
  const r = raw as Record<string, unknown>;
  const hasStrategyField =
    typeof r.strategy === "string" && r.strategy.trim().length > 0;
  const hasExtraProviderField = Array.isArray(r.extra_provider_names);
  const isExplicit =
    r.override_mode === "inherit" ||
    r.override_mode === "custom" ||
    hasStrategyField ||
    hasExtraProviderField ||
    r.strategy !== "primary_first" ||
    (Array.isArray(r.extra_provider_names) && r.extra_provider_names.length > 0);
    
  let strategy = "primary_first";
  if (typeof r.strategy === "string") strategy = r.strategy;
  
  let extraLen = 0;
  if (Array.isArray(r.extra_provider_names)) extraLen = r.extra_provider_names.length;
  
  return isExplicit && (strategy !== "primary_first" || extraLen > 0);
}

export function promptModeBadgeClass(mode: string): string {
  switch (mode) {
    case "task":
      return "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300";
    case "minimal":
      return "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300";
    case "none":
      return "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400";
    default:
      return "";
  }
}
