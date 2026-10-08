"use client";

import { useEffect } from "react";

// Last-resort boundary: replaces the root layout when the layout or its
// providers themselves throw. Because that layout (and globals.css, fonts,
// design tokens) is gone, this must render its own <html>/<body> and use
// inline styles only.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#12263a",
          background: "#ffffff",
        }}
      >
        <main style={{ maxWidth: 420, padding: "0 16px" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: 12, lineHeight: 1.5, color: "#4a5b6c" }}>
            NextHome hit an unexpected problem. It&rsquo;s likely temporary — please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              border: 0,
              borderRadius: 8,
              background: "#1d4ed8",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
