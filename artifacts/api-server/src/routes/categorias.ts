import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, categoriasTable } from "@workspace/db";
import {
  ListCategoriasQueryParams,
  CreateCategoriaBody,
  UpdateCategoriaParams,
  UpdateCategoriaBody,
  DeleteCategoriaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categorias", async (req, res): Promise<void> => {
  const query = ListCategoriasQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.setorId !== undefined) {
    conditions.push(eq(categoriasTable.setorId, query.data.setorId));
  }
  const rows = await db.select().from(categoriasTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(categoriasTable.nome);
  res.json(rows);
});

router.post("/categorias", async (req, res): Promise<void> => {
  const parsed = CreateCategoriaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(categoriasTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/categorias/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoriaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCategoriaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(categoriasTable).set(parsed.data).where(eq(categoriasTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Categoria não encontrada" }); return; }
  res.json(row);
});

router.delete("/categorias/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoriaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(categoriasTable).where(eq(categoriasTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
