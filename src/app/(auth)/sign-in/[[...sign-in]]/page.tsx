import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import { DevAuthNotice } from "@/components/shared/dev-auth-notice";
import { GoogleAccountChooser } from "@/components/shared/google-account-chooser";
import { isClerkEnabled } from "@/config/features";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  if (!isClerkEnabled) return <DevAuthNotice />;
  return (
    <GoogleAccountChooser>
      <SignIn fallbackRedirectUrl="/today" signUpUrl="/sign-up" />
    </GoogleAccountChooser>
  );
}
