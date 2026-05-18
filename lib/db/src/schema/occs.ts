import { pgTable, text, serial, timestamp, integer, numeric, varchar, date } from "drizzle-orm/pg-core";
import { fornecedoresTable } from "./fornecedores";
import { materiaisTable } from "./materiais";

export const occsTable = pgTable("occs", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull().unique(),
  fornecedorId: integer("fornecedor_id").references(() => fornecedoresTable.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Rascunho"),
  prioridade: varchar("prioridade", { length: 20 }).notNull().default("Normal"),
  dataEntrega: date("data_entrega"),
  observacoes: text("observacoes"),
  totalValor: numeric("total_valor", { precision: 14, scale: 2 }).default("0"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const occItensTable = pgTable("occ_itens", {
  id: serial("id").primaryKey(),
  occId: integer("occ_id").references(() => occsTable.id, { onDelete: "cascade" }).notNull(),
  materialId: integer("material_id").references(() => materiaisTable.id).notNull(),
  quantidade: numeric("quantidade", { precision: 12, scale: 4 }).notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 12, scale: 4 }).default("0"),
  unidade: varchar("unidade", { length: 20 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0"),
});

export const occTimelineTable = pgTable("occ_timeline", {
  id: serial("id").primaryKey(),
  occId: integer("occ_id").references(() => occsTable.id, { onDelete: "cascade" }).notNull(),
  statusAnterior: varchar("status_anterior", { length: 50 }),
  statusNovo: varchar("status_novo", { length: 50 }).notNull(),
  comentario: text("comentario"),
  usuario: varchar("usuario", { length: 100 }).default("Sistema"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Occ = typeof occsTable.$inferSelect;
export type InsertOcc = typeof occsTable.$inferInsert;
export type OccItem = typeof occItensTable.$inferSelect;
export type InsertOccItem = typeof occItensTable.$inferInsert;
export type OccTimeline = typeof occTimelineTable.$inferSelect;
export type InsertOccTimeline = typeof occTimelineTable.$inferInsert;
