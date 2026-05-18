import { pgTable, serial, timestamp, integer, numeric, varchar } from "drizzle-orm/pg-core";
import { materiaisTable } from "./materiais";
import { fornecedoresTable } from "./fornecedores";
import { occsTable } from "./occs";

export const precoHistoricoTable = pgTable("preco_historico", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => materiaisTable.id).notNull(),
  fornecedorId: integer("fornecedor_id").references(() => fornecedoresTable.id).notNull(),
  occId: integer("occ_id").references(() => occsTable.id),
  preco: numeric("preco", { precision: 12, scale: 4 }).notNull(),
  quantidade: numeric("quantidade", { precision: 12, scale: 4 }),
  variacao: numeric("variacao", { precision: 8, scale: 2 }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type PrecoHistorico = typeof precoHistoricoTable.$inferSelect;
export type InsertPrecoHistorico = typeof precoHistoricoTable.$inferInsert;
