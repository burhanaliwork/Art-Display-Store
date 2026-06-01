import { Router } from "express";
import { db, paintingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePaintingBody,
  UpdatePaintingBody,
  UpdatePaintingParams,
  GetPaintingParams,
  DeletePaintingParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/paintings", async (req, res) => {
  try {
    const paintings = await db.select().from(paintingsTable).orderBy(paintingsTable.createdAt);
    const mapped = paintings.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      price: parseFloat(p.price),
      imageUrl: p.imageUrl,
      sizes: p.sizes as Array<{ name: string; width: number; height: number; unit: string }>,
      inStock: p.inStock,
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list paintings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/paintings/featured", async (req, res) => {
  try {
    const paintings = await db
      .select()
      .from(paintingsTable)
      .where(eq(paintingsTable.featured, true));
    const mapped = paintings.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      price: parseFloat(p.price),
      imageUrl: p.imageUrl,
      sizes: p.sizes as Array<{ name: string; width: number; height: number; unit: string }>,
      inStock: p.inStock,
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured paintings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/paintings/:id", async (req, res) => {
  const parsed = GetPaintingParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    const [painting] = await db
      .select()
      .from(paintingsTable)
      .where(eq(paintingsTable.id, parsed.data.id));
    if (!painting) return res.status(404).json({ error: "Not found" });

    res.json({
      id: painting.id,
      title: painting.title,
      description: painting.description ?? null,
      price: parseFloat(painting.price),
      imageUrl: painting.imageUrl,
      sizes: painting.sizes as Array<{ name: string; width: number; height: number; unit: string }>,
      inStock: painting.inStock,
      featured: painting.featured,
      createdAt: painting.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get painting");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/paintings", async (req, res) => {
  const parsed = CreatePaintingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const body = parsed.data;
  try {
    const [painting] = await db
      .insert(paintingsTable)
      .values({
        title: body.title,
        description: body.description ?? null,
        price: String(body.price),
        imageUrl: body.imageUrl,
        sizes: (body.sizes ?? []) as unknown as typeof paintingsTable.$inferInsert["sizes"],
        inStock: body.inStock ?? true,
        featured: body.featured ?? false,
      })
      .returning();

    res.status(201).json({
      id: painting.id,
      title: painting.title,
      description: painting.description ?? null,
      price: parseFloat(painting.price),
      imageUrl: painting.imageUrl,
      sizes: painting.sizes as Array<{ name: string; width: number; height: number; unit: string }>,
      inStock: painting.inStock,
      featured: painting.featured,
      createdAt: painting.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create painting");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/paintings/:id", async (req, res) => {
  const paramsParsed = UpdatePaintingParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdatePaintingBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

  const body = bodyParsed.data;
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = String(body.price);
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.sizes !== undefined) updateData.sizes = body.sizes;
  if (body.inStock !== undefined) updateData.inStock = body.inStock;
  if (body.featured !== undefined) updateData.featured = body.featured;

  try {
    const [painting] = await db
      .update(paintingsTable)
      .set(updateData)
      .where(eq(paintingsTable.id, paramsParsed.data.id))
      .returning();

    if (!painting) return res.status(404).json({ error: "Not found" });

    res.json({
      id: painting.id,
      title: painting.title,
      description: painting.description ?? null,
      price: parseFloat(painting.price),
      imageUrl: painting.imageUrl,
      sizes: painting.sizes as Array<{ name: string; width: number; height: number; unit: string }>,
      inStock: painting.inStock,
      featured: painting.featured,
      createdAt: painting.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update painting");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/paintings/:id", async (req, res) => {
  const parsed = DeletePaintingParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    await db.delete(paintingsTable).where(eq(paintingsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete painting");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
