import type { NextConfig } from "next";

const config: NextConfig = {
  // Native-ish Node packages must not be bundled.
  serverExternalPackages: ["imapflow", "nodemailer", "mailparser"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Public OAuth discovery documents must be readable cross-origin by MCP clients.
        source: "/.well-known/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default config;
