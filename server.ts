import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_FILE = path.join(__dirname, "notes.json");

// Initialize notes file if it doesn't exist
if (!fs.existsSync(NOTES_FILE)) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify({}));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/notes/:siteId", (req, res) => {
    const { siteId } = req.params;
    try {
      const data = JSON.parse(fs.readFileSync(NOTES_FILE, "utf-8"));
      const notes = data[siteId] || [];
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to read notes" });
    }
  });

  app.post("/api/notes/:siteId", (req, res) => {
    const { siteId } = req.params;
    const note = req.body;

    try {
      const data = JSON.parse(fs.readFileSync(NOTES_FILE, "utf-8"));
      if (!data[siteId]) {
        data[siteId] = [];
      }
      data[siteId].unshift(note);
      fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
