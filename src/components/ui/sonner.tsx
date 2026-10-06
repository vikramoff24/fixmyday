"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-center"
      offset={20}
      mobileOffset={{ bottom: 84 }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border-strong !bg-elevated !text-foreground !shadow-elevated !text-[13px] !gap-2 !py-3",
          description: "!text-muted-foreground",
          actionButton: "!bg-hover !text-foreground !font-medium !rounded-md hover:!bg-selected",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
