import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const occsTable = pgTable("occs", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull().unique(),
  fornecedorId: integer("fornecedor_id"),
  empresaId: integer("empresa_id"),
  setorId: integer("setor_id"),
  categoriaId: integer("categoria_id"),
  status: text("status").notNull().default("Rascunho"),
  prioridade: text("prioridade").notNull().default("Normal"),
  observacoes: text("observacoes"),
  condicoesPagamento: text("condicoes_pagamento"),
  prazo: text("prazo"),
  layoutPdf: text("layout_pdf"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const occItensTable = pgTable("occ_itens", {
  id: serial("id").primaryKey(),
  occId: integer("occ_id").notNull(),
  materialId: integer("material_id"),
  nomeMaterial: text("nome_material").notNull(),
  unidade: text("unidade").notNull(),
  quantidade: numeric("quantidade", { precision: 10, scale: 3 }).notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 12, scale: 2 }),
  observacao: text("observacao"),
  fornecedorPreferencialId: integer("fornecedor_preferencial_id"),
});

export const insertOccSchema = createInsertSchema(occsTable).omit({ id: true, numero: true, criadoEm: true, atualizadoEm: true });
export type InsertOcc = z.infer<typeof insertOccSchema>;
export type Occ = typeof occsTable.$inferSelect;

export const insertOccItemSchema = createInsertSchema(occItensTable).omit({ id: true });
export type InsertOccItem = z.infer<typeof insertOccItemSchema>;
export type OccItem = typeof occItensTable.$inferSelect;
