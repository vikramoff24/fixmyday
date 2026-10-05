"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { Spark } from "@/components/shared/spark";
import { Kbd } from "@/components/ui/kbd";
import { askNavHref, primaryNavigation, settingsNavItem } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppShell } from "./app-shell-context";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors [&_svg]:size-4",
        active
          ? "bg-selected text-foreground [&_svg]:text-foreground"
          : "text-muted-foreground hover:bg-hover hover:text-foreground [&_svg]:text-subtle-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { openCommandPalette } = useAppShell();
  const SettingsIcon = settingsNavItem.icon;

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-14 items-center px-4">
        <Link href="/today" className="rounded-md" aria-label="FixMyDay home">
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 text-[13px] text-subtle-foreground transition-colors hover:border-border-strong hover:text-muted-foreground"
        >
          <span className="flex-1 text-left">Search or jump to…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav aria-label="Main" className="mt-4 flex flex-col gap-0.5 px-3">
        {primaryNavigation.map((item) => (
          <NavLink key={item.href} href={item.href} active={isActivePath(pathname, item.href)}>
            <item.icon />
            {item.label}
          </NavLink>
        ))}

        <div className="my-3 h-px bg-border" />

        <NavLink href={askNavHref} active={isActivePath(pathname, askNavHref)}>
          <Spark className="text-brand!" />
          Ask AI
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-3">
        <NavLink href={settingsNavItem.href} active={isActivePath(pathname, settingsNavItem.href)}>
          <SettingsIcon />
          {settingsNavItem.label}
        </NavLink>
        <div className="mt-2 flex items-center justify-between border-t border-border px-1 pt-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export { isActivePath };
