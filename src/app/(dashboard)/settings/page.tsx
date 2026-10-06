import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PlanningWindowFormSection } from "@/features/settings/components/planning-window-form";
import { ThemeSetting } from "@/features/settings/components/theme-setting";
import { getPlanningWindow } from "@/features/settings/services/user-service";
import { isClerkEnabled } from "@/config/features";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import { getRequestTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Settings" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-border py-8 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const userId = await requireUserIdOrRedirect();
  const [window, timeZone] = await Promise.all([getPlanningWindow(userId), getRequestTimeZone()]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pt-8 pb-16 md:px-8 md:pt-14">
      <header className="pb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Settings</h1>
      </header>

      <Section
        title="Appearance"
        description="Dark is the default. Your choice is remembered on this device."
      >
        <ThemeSetting />
      </Section>

      <Section
        title="Planning hours"
        description="The planner only schedules flexible tasks inside these hours."
      >
        <PlanningWindowFormSection window={window} />
      </Section>

      <Section title="Time zone" description="Detected from your browser so “today” always means your today.">
        <p className="text-sm">{timeZone.replaceAll("_", " ")}</p>
      </Section>

      <Section
        title="Account"
        description={
          isClerkEnabled
            ? "Manage your profile and security from the avatar menu."
            : "Running in local development mode."
        }
      >
        <p className="text-sm text-muted-foreground">
          {isClerkEnabled
            ? "Signed in with Clerk."
            : "Add Clerk keys to your environment to enable real accounts and sign-in."}
        </p>
      </Section>
    </div>
  );
}
