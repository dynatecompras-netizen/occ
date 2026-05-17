import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import {
  db,
  occsTable,
  occTemplatesTable,
  fornecedoresTable,
  materiaisTable,
  occItensTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/resumo", async (_req, res): Promise<void> => {
  const [totalOccsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(occsTable);
  const [totalTemplatesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(occTemplatesTable);
  const [totalFornecedoresResult] = await db.select({ count: sql<number>`count(*)::int` }).from(fornecedoresTable);
  const [totalMateriaisResult] = await db.select({ count: sql<number>`count(*)::int` }).from(materiaisTable);

  const occsPorStatusResult = await db
    .select({ status: occsTable.status, total: sql<number>`count(*)::int` })
    .from(occsTable)
    .groupBy(occsTable.status);

  const templatesPorTipoResult = await db
    .select({ tipo: occTemplatesTable.tipo, total: sql<number>`count(*)::int` })
    .from(occTemplatesTable)
    .groupBy(occTemplatesTable.tipo);

  const occsRecentes = await db.select().from(occsTable).orderBy(desc(occsTable.criadoEm)).limit(5);

  const valorTotalMesResult = await db
    .select({ total: sql<number>`coalesce(sum(occ_itens.quantidade::numeric * occ_itens.preco_unitario::numeric), 0)::numeric` })
    .from(occItensTable)
    .innerJoin(occsTable, sql`occ_itens.occ_id = occs.id`)
    .where(sql`occs.criado_em >= date_trunc('month', now())`);

  res.json({
    totalOccs: totalOccsResult?.count ?? 0,
    totalTemplates: totalTemplatesResult?.count ?? 0,
    totalFornecedores: totalFornecedoresResult?.count ?? 0,
    totalMateriais: totalMateriaisResult?.count ?? 0,
    occsPorStatus: occsPorStatusResult.map(r => ({ status: r.status, total: r.total })),
    templatesPorTipo: templatesPorTipoResult.map(r => ({ tipo: r.tipo, total: r.total })),
    occsRecentes: occsRecentes.map(o => ({
      ...o,
      fornecedorNome: null,
      empresaNome: null,
      setorNome: null,
      categoriaNome: null,
      valorTotal: null,
    })),
    valorTotalMes: valorTotalMesResult[0]?.total ? parseFloat(String(valorTotalMesResult[0].total)) : null,
  });
});

export default router;
