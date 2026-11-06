import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Serves POST /api/chat during `npm run dev` using the same handler as the Vercel function. */
function devApi(): Plugin {
  return {
    name: "smart-nutrition-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", async () => {
          let body: unknown = null;
          try {
            body = JSON.parse(raw);
          } catch {
            /* invalid JSON → handler returns 400 */
          }
          const mod = (await server.ssrLoadModule("/server/chat.ts")) as typeof import("./server/chat.ts");
          const result = await mod.handleChat(body);
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.body));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load server-only secrets (no VITE_ prefix → never bundled into client code).
  const env = loadEnv(mode, process.cwd(), "");
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  return {
    plugins: [react(), tailwindcss(), devApi()],
  };
});
