import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const occTemplatesTable = pgTable("occ_templates", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo").notNull().default("estrutura"),
  fornecedorPadraoId: integer("fornecedor_padrao_id"),
  empresaId: integer("empresa_id"),
  setorPadraoId: integer("setor_padrao_id"),
  categoriaPadraoId: integer("categoria_padrao_id"),
  prioridade: text("prioridade"),
  observacoesPadrao: text("observacoes_padrao"),
  condicoesPagamento: text("condicoes_pagamento"),
  prazoPadrao: text("prazo_padrao"),
  layoutPdf: text("layout_pdf"),
  assinaturaRodape: text("assinatura_rodape"),
  ativo: boolean("ativo").notNull().default(true),
  favorito: boolean("favorito").notNull().default(false),
  usoCount: integer("uso_count").notNull().default(0),
  ultimoUso: timestamp("ultimo_uso", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const templateItensTable = pgTable("template_itens", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  materialId: integer("material_id"),
  nomeMaterial: text("nome_material").notNull(),
  unidade: text("unidade").notNull(),
  quantidadePadrao: text("quantidade_padrao").notNull().default("1"),
  observacao: text("observacao"),
  fornecedorPreferencialId: integer("fornecedor_preferencial_id"),
});

export const insertOccTemplateSchema = createInsertSchema(occTemplatesTable).omit({ id: true, criadoEm: true, usoCount: true });
export type InsertOccTemplate = z.infer<typeof insertOccTemplateSchema>;
export type OccTemplate = typeof occTemplatesTable.$inferSelect;

export const insertTemplateItemSchema = createInsertSchema(templateItensTable).omit({ id: true });
export type InsertTemplateItem = z.infer<typeof insertTemplateItemSchema>;
export type TemplateItem = typeof templateItensTable.$inferSelect;
