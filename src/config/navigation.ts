import { CalendarDays, ChartNoAxesColumn, ListChecks, Settings, Sun, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const primaryNavigation: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/insights", label: "Insights", icon: ChartNoAxesColumn },
];

export const settingsNavItem: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export const askNavHref = "/ask";
