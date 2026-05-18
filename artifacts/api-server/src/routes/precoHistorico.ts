import { Router, type IRouter } from "express";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { db, precoHistoricoTable, materiaisTable, fornecedoresTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/preco-historico", async (req, res): Promise<void> => {
  const { materialId, fornecedorId, de, ate, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (materialId) conditions.push(eq(precoHistoricoTable.materialId, parseInt(materialId)));
  if (fornecedorId) conditions.push(eq(precoHistoricoTable.fornecedorId, parseInt(fornecedorId)));
  if (de) conditions.push(gte(precoHistoricoTable.criadoEm, new Date(de)));
  if (ate) conditions.push(lte(precoHistoricoTable.criadoEm, new Date(ate)));

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

  const rows = await db.select().from(precoHistoricoTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(precoHistoricoTable.criadoEm))
    .limit(limitNum).offset((pageNum - 1) * limitNum);

  const enriched = await Promise.all(rows.map(async (p) => {
    const [material] = await db.select().from(materiaisTable).where(eq(materiaisTable.id, p.materialId));
    const [fornecedor] = await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, p.fornecedorId));
    return {
      ...p,
      preco: parseFloat(String(p.preco)),
      quantidade: p.quantidade ? parseFloat(String(p.quantidade)) : null,
      variacao: p.variacao ? parseFloat(String(p.variacao)) : null,
      materialNome: material?.nome ?? null,
      materialCodigo: material?.codigo ?? null,
      fornecedorNome: fornecedor?.razaoSocial ?? null,
    };
  }));

  res.json(enriched);
});

router.get("/preco-historico/:materialId", async (req, res): Promise<void> => {
  const materialId = parseInt(req.params.materialId);
  if (isNaN(materialId)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  const rows = await db.select().from(precoHistoricoTable)
    .where(eq(precoHistoricoTable.materialId, materialId))
    .orderBy(desc(precoHistoricoTable.criadoEm)).limit(50);
  const enriched = await Promise.all(rows.map(async (p) => {
    const [fornecedor] = await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, p.fornecedorId));
    return { ...p, preco: parseFloat(String(p.preco)), variacao: p.variacao ? parseFloat(String(p.variacao)) : null, fornecedorNome: fornecedor?.razaoSocial ?? null };
  }));
  res.json(enriched);
});

router.post("/preco-historico", async (req, res): Promise<void> => {
  const { materialId, fornecedorId, preco, quantidade } = req.body;
  if (!materialId || !fornecedorId || !preco) {
    res.status(400).json({ error: "materialId, fornecedorId e preco são obrigatórios", code: "VALIDATION_ERROR" }); return;
  }
  const [lastPrice] = await db.select().from(precoHistoricoTable)
    .where(and(eq(precoHistoricoTable.materialId, materialId), eq(precoHistoricoTable.fornecedorId, fornecedorId)))
    .orderBy(desc(precoHistoricoTable.criadoEm)).limit(1);
  const previousPrice = lastPrice ? parseFloat(String(lastPrice.preco)) : 0;
  const variacao = previousPrice > 0 ? ((preco - previousPrice) / previousPrice) * 100 : null;
  const [record] = await db.insert(precoHistoricoTable).values({
    materialId, fornecedorId, preco: String(preco),
    quantidade: quantidade ? String(quantidade) : null,
    variacao: variacao !== null ? String(variacao.toFixed(2)) : null,
  }).returning();
  res.status(201).json({ ...record, preco: parseFloat(String(record.preco)), variacao: record.variacao ? parseFloat(String(record.variacao)) : null });
});

router.get("/preco-historico/export", async (req, res): Promise<void> => {
  const { materialId, fornecedorId } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (materialId) conditions.push(eq(precoHistoricoTable.materialId, parseInt(materialId)));
  if (fornecedorId) conditions.push(eq(precoHistoricoTable.fornecedorId, parseInt(fornecedorId)));
  const rows = await db.select().from(precoHistoricoTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(precoHistoricoTable.criadoEm));

  let csv = "Material ID,Fornecedor ID,Preço,Quantidade,Variação %,Data\n";
  for (const r of rows) {
    csv += `${r.materialId},${r.fornecedorId},${r.preco},${r.quantidade || ""},${r.variacao || ""},${r.criadoEm.toISOString()}\n`;
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=historico-precos.csv");
  res.send(csv);
});

export default router;
