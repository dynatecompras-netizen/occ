import { Router, type IRouter } from "express";
import { desc, sql, eq } from "drizzle-orm";
import { db, occsTable, fornecedoresTable, materiaisTable, occItensTable, templatesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [totalOccs] = await db.select({ count: sql<number>`count(*)::int` }).from(occsTable);
  const [totalFornecedores] = await db.select({ count: sql<number>`count(*)::int` }).from(fornecedoresTable).where(eq(fornecedoresTable.ativo, true));
  const [totalMateriais] = await db.select({ count: sql<number>`count(*)::int` }).from(materiaisTable).where(eq(materiaisTable.ativo, true));

  const occsPorStatus = await db
    .select({ status: occsTable.status, total: sql<number>`count(*)::int` })
    .from(occsTable).groupBy(occsTable.status);

  const occsRecentes = await db.select().from(occsTable).orderBy(desc(occsTable.criadoEm)).limit(10);
  const enrichedRecentes = await Promise.all(occsRecentes.map(async (occ) => {
    const [f] = await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, occ.fornecedorId));
    const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, occ.id));
    const valorTotal = itens.reduce((s, i) => s + parseFloat(String(i.quantidade)) * parseFloat(String(i.precoUnitario || "0")), 0);
    return { ...occ, fornecedorNome: f?.razaoSocial ?? null, valorTotal: valorTotal > 0 ? valorTotal : parseFloat(String(occ.totalValor || "0")) };
  }));

  // Stock alerts
  const alertasEstoque = await db.select().from(materiaisTable)
    .where(sql`${materiaisTable.estoqueAtual}::numeric <= ${materiaisTable.estoqueMinimo}::numeric AND ${materiaisTable.ativo} = true AND ${materiaisTable.estoqueMinimo}::numeric > 0`);

  res.json({
    totalOccs: totalOccs?.count ?? 0,
    occsPorStatus: occsPorStatus.map(r => ({ status: r.status, total: r.total })),
    totalFornecedores: totalFornecedores?.count ?? 0,
    totalMateriais: totalMateriais?.count ?? 0,
    occsRecentes: enrichedRecentes,
    alertasEstoque: alertasEstoque.map(m => ({
      ...m,
      estoqueAtual: parseFloat(String(m.estoqueAtual)),
      estoqueMinimo: parseFloat(String(m.estoqueMinimo)),
    })),
  });
});

export default router;
