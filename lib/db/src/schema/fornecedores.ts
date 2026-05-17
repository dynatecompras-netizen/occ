import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fornecedoresTable = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  contato: text("contato"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFornecedorSchema = createInsertSchema(fornecedoresTable).omit({ id: true, criadoEm: true });
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type Fornecedor = typeof fornecedoresTable.$inferSelect;
