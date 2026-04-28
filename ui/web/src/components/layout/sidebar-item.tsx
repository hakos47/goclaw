import { Link, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  collapsed?: boolean;
  external?: boolean;
  className?: string;
}

export function SidebarItem({
  to,
  icon: Icon,
  label,
  badge,
  collapsed,
  external,
  className: customClassName,
}: SidebarItemProps) {
  const location = useLocation();
  const active = !external && (location.pathname === to || location.pathname.startsWith(to + "/"));

  const className = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    "hover:bg-purple-500/10 hover:text-purple-400",
    active && "bg-purple-500/20 text-purple-400 font-medium",
    collapsed && "justify-center px-2",
    customClassName
  );

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
          {badge}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={collapsed ? label : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={to}
      className={className}
      title={collapsed ? label : undefined}
    >
      {content}
    </Link>
  );
}
