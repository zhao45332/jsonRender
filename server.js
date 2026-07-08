import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const dataDir = join(root, "data");
const dbPath = join(dataDir, "db.json");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    await writeFile(dbPath, JSON.stringify({ cards: [] }, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const content = await readFile(dbPath, "utf8");
  try {
    const db = JSON.parse(content);
    return {
      cards: Array.isArray(db.cards) ? db.cards : [],
      ideas: Array.isArray(db.ideas) ? db.ideas : []
    };
  } catch {
    return { cards: [], ideas: [] };
  }
}

async function writeDb(db) {
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function acceptsHtml(req) {
  return String(req.headers.accept || "").includes("text/html");
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return JSON.parse(raw);
}

function cleanValue(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validateCard(input) {
  const card = {
    title: cleanValue(input.title, 5000) || "Business Card",
    name: cleanValue(input.name, 5000),
    phone: cleanValue(input.phone, 5000),
    email: cleanValue(input.email, 5000),
    remark: cleanValue(input.remark, 5000),
    toolbarItems: cleanValue(input.toolbarItems, 5000)
  };

  const errors = {};
  if (!card.name) errors.name = "请输入名字";
  if (!card.phone) errors.phone = "请输入手机号";
  if (!card.email) errors.email = "请输入邮箱";
  if (card.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(card.email)) {
    errors.email = "邮箱格式不正确";
  }

  return { card, errors };
}

async function handleApi(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (req.method === "GET" && pathname === "/api/cards") {
    const db = await readDb();
    sendJson(res, 200, { cards: db.cards.slice(-20).reverse() });
    return;
  }

  if (req.method === "POST" && pathname === "/api/cards") {
    try {
      const body = await parseJsonBody(req);
      const { card, errors } = validateCard(body);
      if (Object.keys(errors).length) {
        sendJson(res, 422, { errors });
        return;
      }

      const db = await readDb();
      const savedCard = {
        id: crypto.randomUUID(),
        ...card,
        createdAt: new Date().toISOString()
      };
      db.cards.push(savedCard);
      await writeDb(db);
      sendJson(res, 201, { card: savedCard });
    } catch {
      sendJson(res, 400, { message: "请求内容不是有效 JSON" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/ideas") {
    try {
      const body = await parseJsonBody(req);
      const ideaText = cleanValue(body.ideaText, 5000);
      if (!ideaText) {
        sendJson(res, 422, { message: "请输入建议内容" });
        return;
      }

      const db = await readDb();
      const savedIdea = {
        id: crypto.randomUUID(),
        ideaText,
        createdAt: new Date().toISOString()
      };
      db.ideas.push(savedIdea);
      await writeDb(db);
      if (acceptsHtml(req)) {
        res.writeHead(303, { location: "/?idea=saved" });
        res.end();
        return;
      }
      sendJson(res, 201, { idea: savedIdea });
    } catch {
      sendJson(res, 400, { message: "请求内容不是有效 JSON" });
    }
    return;
  }

  sendJson(res, 404, { message: "Not found" });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const type = mimeTypes[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

await ensureDb();

createServer(async (req, res) => {
  try {
    if (req.url?.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: "Server error" });
  }
}).listen(port, () => {
  console.log(`jsonRender is running at http://localhost:${port}`);
});
