import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const empresasTable = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmpresaSchema = createInsertSchema(empresasTable).omit({ id: true, criadoEm: true });
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;
export type Empresa = typeof empresasTable.$inferSelect;
