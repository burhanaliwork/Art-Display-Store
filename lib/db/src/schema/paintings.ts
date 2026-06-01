import { pgTable, text, serial, timestamp, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paintingsTable = pgTable("paintings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  sizes: jsonb("sizes").notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaintingSchema = createInsertSchema(paintingsTable).omit({ id: true, createdAt: true });
export type InsertPainting = z.infer<typeof insertPaintingSchema>;
export type Painting = typeof paintingsTable.$inferSelect;
