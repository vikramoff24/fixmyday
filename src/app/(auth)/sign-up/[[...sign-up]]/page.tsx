import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { DevAuthNotice } from "@/components/shared/dev-auth-notice";
import { isClerkEnabled } from "@/config/features";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  if (!isClerkEnabled) return <DevAuthNotice />;
  return <SignUp fallbackRedirectUrl="/today" signInUrl="/sign-in" />;
}
