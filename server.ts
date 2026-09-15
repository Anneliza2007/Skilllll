import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import express from "express";
import { app } from "./server/apiApp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Vite & Static Asset Handling for local dev and container hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SkillMatcher server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
