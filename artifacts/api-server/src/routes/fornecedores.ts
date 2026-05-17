import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, fornecedoresTable } from "@workspace/db";
import {
  ListFornecedoresQueryParams,
  GetFornecedorParams,
  CreateFornecedorBody,
  UpdateFornecedorParams,
  UpdateFornecedorBody,
  DeleteFornecedorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fornecedores", async (req, res): Promise<void> => {
  const query = ListFornecedoresQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [];
  if (query.data.ativo !== undefined) {
    conditions.push(eq(fornecedoresTable.ativo, query.data.ativo));
  }
  if (query.data.search) {
    conditions.push(ilike(fornecedoresTable.nome, `%${query.data.search}%`));
  }
  const rows = await db
    .select()
    .from(fornecedoresTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(fornecedoresTable.nome);
  res.json(rows);
});

router.post("/fornecedores", async (req, res): Promise<void> => {
  const parsed = CreateFornecedorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(fornecedoresTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.get("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = GetFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Fornecedor não encontrado" }); return; }
  res.json(row);
});

router.patch("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = UpdateFornecedorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateFornecedorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(fornecedoresTable).set(parsed.data).where(eq(fornecedoresTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Fornecedor não encontrado" }); return; }
  res.json(row);
});

router.delete("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = DeleteFornecedorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(fornecedoresTable).where(eq(fornecedoresTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
