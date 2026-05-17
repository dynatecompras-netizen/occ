import { pgTable, serial, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const historicosPrecosTable = pgTable("historicos_precos", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull(),
  fornecedorId: integer("fornecedor_id"),
  preco: numeric("preco", { precision: 12, scale: 2 }).notNull(),
  occId: integer("occ_id"),
  occNumero: text("occ_numero"),
  dataCompra: timestamp("data_compra", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHistoricoPrecoSchema = createInsertSchema(historicosPrecosTable).omit({ id: true });
export type InsertHistoricoPreco = z.infer<typeof insertHistoricoPrecoSchema>;
export type HistoricoPreco = typeof historicosPrecosTable.$inferSelect;
