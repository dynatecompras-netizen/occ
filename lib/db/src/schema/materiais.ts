import { pgTable, text, serial, timestamp, boolean, varchar, numeric } from "drizzle-orm/pg-core";

export const materiaisTable = pgTable("materiais", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  categoria: varchar("categoria", { length: 100 }),
  unidade: varchar("unidade", { length: 20 }).notNull().default("un"),
  estoqueAtual: numeric("estoque_atual", { precision: 12, scale: 4 }).default("0").notNull(),
  estoqueMinimo: numeric("estoque_minimo", { precision: 12, scale: 4 }).default("0").notNull(),
  estoqueProjetado: numeric("estoque_projetado", { precision: 12, scale: 4 }).default("0"),
  precoReferencia: numeric("preco_referencia", { precision: 12, scale: 4 }),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Material = typeof materiaisTable.$inferSelect;
export type InsertMaterial = typeof materiaisTable.$inferInsert;
