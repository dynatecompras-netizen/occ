import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriasTable = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  setorId: integer("setor_id"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategoriaSchema = createInsertSchema(categoriasTable).omit({ id: true, criadoEm: true });
export type InsertCategoria = z.infer<typeof insertCategoriaSchema>;
export type Categoria = typeof categoriasTable.$inferSelect;
