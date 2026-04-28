import { AlertCircle, FileText, MessageSquare, Network, Play, Settings, Bot, Users } from "lucide-svelte";
import type { ComponentType } from "svelte";
import type { Icon } from "lucide-svelte";

export interface CategoryConfig {
  icon: ComponentType<Icon>;
  iconColor: string;
  borderColor: string;
}

export function getCategoryConfig(event: string): CategoryConfig {
  if (event.startsWith("team.task.")) {
    return {
      icon: FileText,
      iconColor: "text-blue-500",
      borderColor: "border-l-blue-500/50",
    };
  }
  if (event === "team.message.sent") {
    return {
      icon: MessageSquare,
      iconColor: "text-emerald-500",
      borderColor: "border-l-emerald-500/50",
    };
  }
  if (event === "agent") {
    return {
      icon: Bot,
      iconColor: "text-goclaw-neon-purple",
      borderColor: "border-l-goclaw-neon-purple/50",
    };
  }
  if (
    event.startsWith("team.created") ||
    event.startsWith("team.updated") ||
    event.startsWith("team.deleted") ||
    event.startsWith("team.member.")
  ) {
    return {
      icon: Users,
      iconColor: "text-amber-500",
      borderColor: "border-l-amber-500/50",
    };
  }
  if (event.startsWith("agent_link.")) {
    return {
      icon: Network,
      iconColor: "text-fuchsia-500",
      borderColor: "border-l-fuchsia-500/50",
    };
  }

  // Fallbacks
  if (event.includes("error") || event.includes("failed")) {
    return {
      icon: AlertCircle,
      iconColor: "text-red-500",
      borderColor: "border-l-red-500/50",
    };
  }

  return {
    icon: Settings,
    iconColor: "text-white/50",
    borderColor: "border-l-white/20",
  };
}
