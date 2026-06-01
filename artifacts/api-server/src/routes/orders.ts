import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";

const router = Router();

function mapOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    notes: o.notes ?? null,
    items: o.items as Array<{ paintingId: number; paintingTitle: string; size: string; price: number }>,
    totalPrice: parseFloat(o.totalPrice),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    res.json(orders.map(mapOrder));
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/stats", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      totalRevenue: orders
        .filter((o) => o.status !== "cancelled")
        .reduce((acc, o) => acc + parseFloat(o.totalPrice), 0),
    };
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get order stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  const parsed = GetOrderParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, parsed.data.id));
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(mapOrder(order));
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const body = parsed.data;
  const totalPrice = (body.items ?? []).reduce((acc, item) => acc + item.price, 0);

  try {
    const [order] = await db
      .insert(ordersTable)
      .values({
        customerName: body.customerName,
        phone: body.phone,
        address: body.address,
        notes: body.notes ?? null,
        items: (body.items ?? []) as unknown as typeof ordersTable.$inferInsert["items"],
        totalPrice: String(totalPrice),
        status: "pending",
      })
      .returning();

    res.status(201).json(mapOrder(order));
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  const paramsParsed = UpdateOrderStatusParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(ordersTable.id, paramsParsed.data.id))
      .returning();

    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(mapOrder(order));
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
