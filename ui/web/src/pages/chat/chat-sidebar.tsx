import { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Target, LifeBuoy, TrendingUp, ChevronDown, ChevronRight, User, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentSelector } from "@/components/chat/agent-selector";
import { SessionSwitcher } from "@/components/chat/session-switcher";
import { cn } from "@/lib/utils";
import type { SessionInfo } from "@/types/session";
import type { SessionCategory } from "./hooks/use-chat-sessions";

interface ChatSidebarProps {
  agentId: string;
  onAgentChange: (agentId: string) => void;
  sessions: SessionInfo[];
  categorized: Record<SessionCategory, SessionInfo[]>;
  sessionsLoading: boolean;
  activeSessionKey: string;
  onSessionSelect: (key: string) => void;
  onDeleteSession?: (key: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar = memo(function ChatSidebar({
  agentId,
  onAgentChange,
  sessions,
  categorized,
  sessionsLoading,
  activeSessionKey,
  onSessionSelect,
  onDeleteSession,
  onNewChat,
}: ChatSidebarProps) {
  const { t } = useTranslation("chat");
  const { t: tSidebar } = useTranslation("sidebar");

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
      personal: false,
      inbound: false,
      support: false,
      system: true,    // System collapsed by default
      evolution: true, // Evolution collapsed by default
    });

    // Auto-expand category containing the active session
    useEffect(() => {
      if (!activeSessionKey) return;
      for (const [cat, items] of Object.entries(categorized)) {
        if (items.some(s => s.key === activeSessionKey)) {
          setCollapsed(prev => ({ ...prev, [cat]: false }));
          break;
        }
      }
    }, [activeSessionKey, categorized]);

    const toggleCategory = (key: string) => {
      setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const categories: { key: SessionCategory; icon: any; label: string }[] = [
      { key: "personal", icon: User, label: tSidebar("nav.sessionsPersonal") },
      { key: "inbound", icon: Target, label: tSidebar("nav.sessionsInbound") },
      { key: "support", icon: LifeBuoy, label: tSidebar("nav.sessionsSupport") },
      { key: "system", icon: Terminal, label: tSidebar("nav.sessionsSystem") },
      { key: "evolution", icon: TrendingUp, label: tSidebar("nav.sessionsEvolution") },
    ];

  return (
    <div className="flex h-full w-72 max-w-[85vw] flex-col border-r bg-background">
      {/* Agent selector */}
      <div className="border-b p-3">
        <AgentSelector value={agentId} onChange={onAgentChange} />
      </div>

      {/* New chat button */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          {t("newChat")}
        </Button>
      </div>

      {/* Session list - Categorized & Collapsible */}
      <div className="flex-1 overflow-y-auto pb-4">
        {sessions.length === 0 && sessionsLoading ? (
          <SessionSwitcher
            sessions={[]}
            activeKey=""
            onSelect={() => {}}
            loading={true}
          />
        ) : (
          <div className="space-y-1">
            {categories.map((cat) => {
              const items = categorized[cat.key] || [];
              if (items.length === 0 && !sessionsLoading) return null;

              const isCollapsed = collapsed[cat.key];
              const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;

              return (
                <div key={cat.key} className="px-2">
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                      "hover:bg-muted/50 text-muted-foreground/70"
                    )}
                  >
                    <ChevronIcon className="h-3 w-3 shrink-0 opacity-50" />
                    <cat.icon className="h-3 w-3 shrink-0" />
                    <span>{cat.label}</span>
                    {!isCollapsed && <span className="ml-auto opacity-50">{items.length}</span>}
                    {isCollapsed && items.length > 0 && (
                      <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-muted px-1 text-[9px] opacity-70">
                        {items.length}
                      </span>
                    )}
                  </button>
                  
                  {!isCollapsed && (
                    <div className="mt-0.5">
                      <SessionSwitcher
                        sessions={items}
                        activeKey={activeSessionKey}
                        onSelect={onSessionSelect}
                        onDelete={onDeleteSession}
                        loading={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
