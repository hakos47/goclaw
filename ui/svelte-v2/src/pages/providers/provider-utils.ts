export const PROVIDER_TYPE_BADGE: Record<string, { label: string; variant: string }> = {
  chatgpt_oauth: { label: "ChatGPT OAuth", variant: "default" },
  openai: { label: "OpenAI", variant: "secondary" },
  anthropic: { label: "Anthropic", variant: "secondary" },
  google: { label: "Google", variant: "secondary" },
  ollama: { label: "Ollama", variant: "outline" },
};

export function getChatGPTOAuthPoolOwnership(providers: any[]) {
  const membersByOwner = new Map<string, string[]>();
  const ownerByMember = new Map<string, string>();
  const strategyByOwner = new Map<string, string>();

  for (const provider of providers) {
    if (provider.provider_type !== "chatgpt_oauth") continue;

    const rawPool = provider.settings?.codex_pool;
    if (rawPool && typeof rawPool === "object") {
      const strategy = rawPool.strategy || "primary_first";
      const members = Array.isArray(rawPool.extra_provider_names) ? rawPool.extra_provider_names : [];
      
      if (members.length > 0) {
        membersByOwner.set(provider.name, members);
        strategyByOwner.set(provider.name, strategy);
        for (const member of members) {
          ownerByMember.set(member, provider.name);
        }
      }
    }
  }

  return { membersByOwner, ownerByMember, strategyByOwner };
}

export function sortProvidersForPoolHierarchy(providers: any[], poolOwnership: any) {
  const result: any[] = [];
  const processed = new Set<string>();

  const ownerNames = Array.from(poolOwnership.membersByOwner.keys()) as string[];
  const providersByName = new Map(providers.map(p => [p.name, p]));

  // Process owners and their members first
  for (const ownerName of ownerNames) {
    const owner = providersByName.get(ownerName);
    if (owner && !processed.has(owner.name)) {
      result.push(owner);
      processed.add(owner.name);
    }

    const members = poolOwnership.membersByOwner.get(ownerName) || [];
    for (const memberName of members) {
      const member = providersByName.get(memberName);
      if (member && !processed.has(member.name)) {
        result.push(member);
        processed.add(member.name);
      }
    }
  }

  // Process remaining standalone providers
  for (const provider of providers) {
    if (!processed.has(provider.name)) {
      result.push(provider);
      processed.add(provider.name);
    }
  }

  return result;
}
