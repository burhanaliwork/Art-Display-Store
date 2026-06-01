import { Router } from "express";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { AdminLoginBody } from "@workspace/api-zod";

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
