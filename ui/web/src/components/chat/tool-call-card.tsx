import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wrench, AlertTriangle, ChevronRight, Zap, CheckCircle2, XCircle } from "lucide-react";
import type { ToolStreamEntry } from "@/types/chat";

const isSkillTool = (name: string) => name === "use_skill";
const isWhatsAppTool = (name: string) => name.startsWith("whatsapp_");

interface WhatsAppChatsResult {
  count: number;
  chats: { jid: string; name: string; participant_count: number }[];
}
interface WhatsAppContactsResult {
  count: number;
  contacts: { jid: string; name: string }[];
}
interface WhatsAppMembersResult {
  group_jid: string;
  group_name: string;
  count: number;
  members: { jid: string; name: string; admin: boolean }[];
}
interface WhatsAppSimpleResult {
  success?: boolean;
  message_id?: string;
  to?: string;
  jid?: string;
  has_photo?: boolean;
  photo_url?: string;
  group_jid?: string;
  invite_link?: string;
  error?: string;
}

function renderWhatsAppChats(data: WhatsAppChatsResult) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium mb-1">{data.count} groups found</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-1 font-medium text-muted-foreground">Group</th>
              <th className="text-right pb-1 font-medium text-muted-foreground">Members</th>
            </tr>
          </thead>
          <tbody>
            {data.chats.map((chat) => (
              <tr key={chat.jid} className="border-b border-muted/50">
                <td className="py-1">{chat.name || <span className="text-muted-foreground">{chat.jid}</span>}</td>
                <td className="py-1 text-right">{chat.participant_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderWhatsAppContacts(data: WhatsAppContactsResult) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium mb-1">{data.count} contacts</p>
      <div className="max-h-40 overflow-y-auto">
        {data.contacts.slice(0, 20).map((c) => (
          <div key={c.jid} className="flex items-center justify-between py-0.5 border-b border-muted/50 text-xs">
            <span>{c.name || <span className="text-muted-foreground">{c.jid}</span>}</span>
            <code className="text-muted-foreground text-2xs">{c.jid}</code>
          </div>
        ))}
        {data.contacts.length > 20 && <p className="text-xs text-muted-foreground mt-1">...and {data.contacts.length - 20} more</p>}
      </div>
    </div>
  );
}

function renderWhatsAppMembers(data: WhatsAppMembersResult) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium mb-1">{data.group_name || data.group_jid} — {data.count} members</p>
      <div className="max-h-40 overflow-y-auto">
        {data.members.map((m) => (
          <div key={m.jid} className="flex items-center justify-between py-0.5 border-b border-muted/50 text-xs">
            <span className="flex items-center gap-1">
              {m.name || m.jid}
              {m.admin && <span className="text-2xs bg-blue-100 text-blue-700 px-1 rounded dark:bg-blue-900/30 dark:text-blue-300">admin</span>}
            </span>
            <code className="text-muted-foreground text-2xs">{m.jid}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderWhatsAppSimple(data: WhatsAppSimpleResult) {
  if (data.error) {
    return (
      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
        <XCircle className="h-3.5 w-3.5" />
        <span>{data.error}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>
        {data.success !== false ? "Done" : "Completed"}
        {data.message_id && <span className="text-muted-foreground ml-1">— ID: {data.message_id}</span>}
        {data.invite_link && <span className="text-muted-foreground ml-1">— {data.invite_link}</span>}
      </span>
    </div>
  );
}

function formatWhatsAppResult(name: string, result: string): React.ReactNode {
  if (!result) return null;
  try {
    const data = JSON.parse(result);
    switch (name) {
      case "whatsapp_list_chats":
        return renderWhatsAppChats(data as WhatsAppChatsResult);
      case "whatsapp_list_contacts":
        return renderWhatsAppContacts(data as WhatsAppContactsResult);
      case "whatsapp_group_members":
        return renderWhatsAppMembers(data as WhatsAppMembersResult);
      case "whatsapp_send_message":
      case "whatsapp_group_create":
      case "whatsapp_group_invite":
      case "whatsapp_profile_photo":
        return renderWhatsAppSimple(data as WhatsAppSimpleResult);
      default:
        return <pre className="whitespace-pre-wrap text-xs-plus font-mono">{result}</pre>;
    }
  } catch {
    return <pre className="whitespace-pre-wrap text-xs-plus font-mono">{result}</pre>;
  }
}

/** Build a short summary string from tool arguments for inline display. */
function buildToolSummary(entry: ToolStreamEntry): string | null {
  if (!entry.arguments) return null;
  const args = entry.arguments;
  const key = args.path ?? args.command ?? args.query ?? args.url ?? args.name;
  if (typeof key === "string") return key.length > 80 ? key.slice(0, 77) + "..." : key;
  return null;
}

interface ToolCallCardProps {
  entry: ToolStreamEntry;
  /** Compact mode — less padding, used inside merged groups */
  compact?: boolean;
}

export function ToolCallCard({ entry, compact }: ToolCallCardProps) {
  const { t } = useTranslation("common");
  const hasDetails = entry.arguments || entry.result;
  const hasError = entry.phase === "error" && !!entry.errorContent;
  const canExpand = hasDetails || hasError;
  const [expanded, setExpanded] = useState(false);
  const summary = buildToolSummary(entry);
  const skill = isSkillTool(entry.name);
  const displayName = skill ? `skill: ${(entry.arguments?.name as string) || "unknown"}` : entry.name;

  return (
    <div className={compact ? "" : "rounded-md border bg-muted"}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs"
        onClick={() => canExpand && setExpanded((v) => !v)}
        disabled={!canExpand}
      >
        <ToolIcon phase={entry.phase} isSkill={skill} />
        <span className="font-medium shrink-0">{displayName}</span>
        {summary && <span className="truncate text-muted-foreground ml-1">{summary}</span>}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          <PhaseLabel phase={entry.phase} isSkill={skill} />
          {canExpand && (
            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          )}
        </span>
      </button>
      {expanded && canExpand && (
        <div className="border-t border-muted px-2 py-1.5 space-y-1.5">
          {hasError && (
            <pre className="text-red-500 whitespace-pre-wrap text-xs">{entry.errorContent}</pre>
          )}
          {entry.arguments && Object.keys(entry.arguments).length > 0 && (
            <div>
              <div className="text-2xs font-semibold uppercase text-muted-foreground mb-0.5">{t("toolArguments")}</div>
              <pre className="whitespace-pre-wrap text-xs-plus font-mono bg-background rounded p-1.5 max-h-40 overflow-y-auto">
                {JSON.stringify(entry.arguments, null, 2)}
              </pre>
            </div>
          )}
          {entry.result && (
            <div>
              <div className="text-2xs font-semibold uppercase text-muted-foreground mb-0.5">{t("toolResult")}</div>
              {isWhatsAppTool(entry.name) ? (
                formatWhatsAppResult(entry.name, entry.result)
              ) : (
                <pre className="whitespace-pre-wrap text-xs-plus font-mono bg-background rounded p-1.5 max-h-40 overflow-y-auto">
                  {entry.result}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolIcon({ phase, isSkill }: { phase: ToolStreamEntry["phase"]; isSkill?: boolean }) {
  const cls = "h-3.5 w-3.5";
  if (isSkill) {
    switch (phase) {
      case "calling": return <Zap className={`${cls} animate-pulse text-amber-500`} />;
      case "completed": return <Zap className={`${cls} text-amber-500`} />;
      case "error": return <AlertTriangle className={`${cls} text-red-500`} />;
      default: return <Zap className={`${cls} text-muted-foreground`} />;
    }
  }
  switch (phase) {
    case "calling": return <Wrench className={`${cls} animate-wobble text-blue-500`} />;
    case "completed": return <Wrench className={`${cls} text-blue-500`} />;
    case "error": return <AlertTriangle className={`${cls} text-red-500`} />;
    default: return <Wrench className={`${cls} text-muted-foreground`} />;
  }
}

function PhaseLabel({ phase, isSkill }: { phase: ToolStreamEntry["phase"]; isSkill?: boolean }) {
  const { t } = useTranslation("common");
  const labels: Record<string, string> = isSkill
    ? { calling: t("skillActivating"), completed: t("skillActivated"), error: t("toolFailed") }
    : { calling: t("toolRunning"), completed: t("toolDone"), error: t("toolFailed") };
  const colors: Record<string, string> = {
    calling: "text-blue-500",
    completed: "text-blue-500",
    error: "text-red-500",
  };
  return <span className={`text-xs-plus ${colors[phase] ?? "text-muted-foreground"}`}>{labels[phase] ?? phase}</span>;
}
