import { Router, type IRouter } from "express";
import { eq, ilike, and, desc } from "drizzle-orm";
import { db, materiaisTable, precoHistoricoTable, fornecedoresTable } from "@workspace/db";
import {
  ListMateriaisQueryParams,
  GetMaterialParams,
  CreateMaterialBody,
  UpdateMaterialParams,
  UpdateMaterialBody,
  DeleteMaterialParams,
  GetMaterialHistoricoPrecosParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/materiais", async (req, res): Promise<void> => {
  const query = ListMateriaisQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.ativo !== undefined) {
    conditions.push(eq(materiaisTable.ativo, query.data.ativo));
  }
  if (query.data.search) {
    conditions.push(ilike(materiaisTable.nome, `%${query.data.search}%`));
  }
  const rows = await db.select().from(materiaisTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(materiaisTable.nome);
  res.json(rows);
});

router.post("/materiais", async (req, res): Promise<void> => {
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(materiaisTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.get("/materiais/:id", async (req, res): Promise<void> => {
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select().from(materiaisTable).where(eq(materiaisTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Material não encontrado" }); return; }
  res.json(row);
});

router.get("/materiais/:id/historico-precos", async (req, res): Promise<void> => {
  const params = GetMaterialHistoricoPrecosParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const rows = await db
    .select({
      id: historicosPrecosTable.id,
      materialId: historicosPrecosTable.materialId,
      fornecedorId: historicosPrecosTable.fornecedorId,
      fornecedorNome: fornecedoresTable.nome,
      preco: historicosPrecosTable.preco,
      occId: historicosPrecosTable.occId,
      occNumero: historicosPrecosTable.occNumero,
      dataCompra: historicosPrecosTable.dataCompra,
    })
    .from(historicosPrecosTable)
    .leftJoin(fornecedoresTable, eq(historicosPrecosTable.fornecedorId, fornecedoresTable.id))
    .where(eq(historicosPrecosTable.materialId, params.data.id))
    .orderBy(desc(historicosPrecosTable.dataCompra));
  res.json(rows.map(r => ({ ...r, preco: parseFloat(String(r.preco)) })));
});

router.patch("/materiais/:id", async (req, res): Promise<void> => {
  const params = UpdateMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(materiaisTable).set(parsed.data).where(eq(materiaisTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Material não encontrado" }); return; }
  res.json(row);
});

router.delete("/materiais/:id", async (req, res): Promise<void> => {
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(materiaisTable).where(eq(materiaisTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
