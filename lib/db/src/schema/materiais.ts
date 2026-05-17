import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const materiaisTable = pgTable("materiais", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  unidade: text("unidade").notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materiaisTable).omit({ id: true, criadoEm: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materiaisTable.$inferSelect;
