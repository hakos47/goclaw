import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Trash2, Phone, Globe } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SessionInfo } from "@/types/session";

interface SessionSwitcherProps {
  sessions: SessionInfo[];
  activeKey: string;
  onSelect: (key: string) => void;
  onDelete?: (key: string) => void;
  loading?: boolean;
}

/** Build a human-friendly label from session metadata or key */
function sessionLabel(session: SessionInfo): string {
  // 1. Explicit label (manual or generated)
  if (session.label) return session.label;

  // 2. Metadata: Chat Title (Groups)
  if (session.metadata?.chat_title) return session.metadata.chat_title;
  
  // 3. Metadata: User Identity
  if (session.metadata?.display_name) return session.metadata.display_name;
  if (session.metadata?.user_name) return session.metadata.user_name;

  const parts = session.key.split(":");
  
  // 4. WhatsApp specific logic
  if (session.channelType === "whatsapp" || session.key.includes("whatsapp")) {
    const jid = parts[parts.length - 1];
    if (jid) {
      const namePart = jid.split("@")[0] ?? jid;
      if (jid.endsWith("@s.whatsapp.net")) return `WA: ${namePart}`;
      if (jid.endsWith("@lid")) return `ID: ${namePart.slice(-8)}`;
      if (jid.endsWith("@g.us")) return `Group: ${namePart.slice(0, 12)}…`;
    }
  }

  // 5. Generic Fallback
  const scope = parts.length >= 3 ? parts.slice(2).join(":") : session.key;
  if (scope.startsWith("ws:direct:")) return `Chat ${scope.replace("ws:direct:", "").slice(0, 8)}`;
  if (scope.startsWith("team:")) return `Team ${scope.replace("team:", "").slice(0, 12)}`;

  return scope.length > 24 ? scope.slice(0, 21) + "…" : scope;
}

export const SessionSwitcher = memo(function SessionSwitcher({ sessions, activeKey, onSelect, onDelete, loading }: SessionSwitcherProps) {
  const { t } = useTranslation("chat");
  const { t: tc } = useTranslation("common");
  const [deleteTarget, setDeleteTarget] = useState<SessionInfo | null>(null);

  if (sessions.length === 0 && loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        {tc("noSessions")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0.5 p-1.5">
        {sessions.map((session) => {
          const isActive = session.key === activeKey;
          const label = sessionLabel(session);
          
          const isWhatsApp = session.channelType === "whatsapp" || session.key.includes("whatsapp");
          const Icon = isWhatsApp ? Phone : (session.channelType === "web" ? Globe : MessageSquare);

          return (
            <button
              key={session.key}
              type="button"
              onClick={() => onSelect(session.key)}
              title={session.key}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isWhatsApp ? "text-green-500/70" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[12px] leading-tight">{label}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-70">
                  <span>{session.messageCount} {tc("messages")}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(session.updated)}</span>
                </div>
              </div>
              {onDelete && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(session);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      setDeleteTarget(session);
                    }
                  }}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 max-sm:opacity-100"
                  title={t("deleteChat")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteChat")}</DialogTitle>
            <DialogDescription>{t("deleteChatConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{tc("cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  onDelete?.(deleteTarget.key);
                  setDeleteTarget(null);
                }
              }}
            >
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
