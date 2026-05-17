import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const setoresTable = pgTable("setores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSetorSchema = createInsertSchema(setoresTable).omit({ id: true, criadoEm: true });
export type InsertSetor = z.infer<typeof insertSetorSchema>;
export type Setor = typeof setoresTable.$inferSelect;
