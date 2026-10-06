"use client";

import { useEffect } from "react";

// Last-resort boundary when the root layout itself fails; it must render its own <html>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#141518", color: "#efeff2" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Something went wrong.</p>
            <p style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>Please refresh the page to try again.</p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 20,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#222",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
