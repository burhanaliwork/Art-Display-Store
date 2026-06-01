import { Router } from "express";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { AdminLoginBody } from "@workspace/api-zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Simple in-memory session store
const sessions = new Map<string, { username: string; expiresAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getSession(req: { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> }): string | null {
  const authHeader = req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

router.post("/admin/upload", (req, res) => {
  const token = getSession(req as Parameters<typeof getSession>[0]);
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return res.status(401).json({ error: "Session expired" });

  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const host = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${host}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

router.post("/admin/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { username, password } = parsed.data;
  const passwordHash = hashPassword(password);

  try {
    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, username));

    if (!admin || admin.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken();
    sessions.set(token, { username: admin.username, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });

    res.json({ username: admin.username, loggedIn: true, token });
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/me", (req, res) => {
  const token = getSession(req as Parameters<typeof getSession>[0]);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token ?? "");
    return res.status(401).json({ error: "Session expired" });
  }

  res.json({ username: session.username, loggedIn: true });
});

router.post("/admin/logout", (req, res) => {
  const token = getSession(req as Parameters<typeof getSession>[0]);
  if (token) sessions.delete(token);
  res.json({ success: true });
});

export default router;
