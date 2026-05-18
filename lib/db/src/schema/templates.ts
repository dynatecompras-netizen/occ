import { pgTable, text, serial, timestamp, boolean, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { fornecedoresTable } from "./fornecedores";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 50 }).default("Padrão"),
  favorito: boolean("favorito").default(false).notNull(),
  contagemUso: integer("contagem_uso").default(0).notNull(),
  fornecedorId: integer("fornecedor_id").references(() => fornecedoresTable.id),
  itens: jsonb("itens").default("[]"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Template = typeof templatesTable.$inferSelect;
export type InsertTemplate = typeof templatesTable.$inferInsert;

// Type for template items stored in JSONB
export interface TemplateItem {
  materialId: number;
  quantidade: number;
  unidade: string;
}
