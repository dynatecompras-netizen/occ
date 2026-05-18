import { pgTable, text, serial, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const fornecedoresTable = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  razaoSocial: varchar("razao_social", { length: 200 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 150 }),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  email: varchar("email", { length: 150 }),
  telefone: varchar("telefone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Fornecedor = typeof fornecedoresTable.$inferSelect;
export type InsertFornecedor = typeof fornecedoresTable.$inferInsert;
