import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import {
  db,
  occsTable,
  occTemplatesTable,
  fornecedoresTable,
  materiaisTable,
  occItensTable,
  setoresTable,
  categoriasTable,
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

  const occsRecentesRaw = await db.select().from(occsTable).orderBy(desc(occsTable.criadoEm)).limit(6);

  const occsRecentes = await Promise.all(occsRecentesRaw.map(async (occ) => {
    const itens = await db.select().from(occItensTable).where(sql`occ_id = ${occ.id}`);
    const valorTotal = itens.reduce((s, i) => {
      const qty = parseFloat(String(i.quantidade));
      const price = i.precoUnitario != null ? parseFloat(String(i.precoUnitario)) : 0;
      return s + qty * price;
    }, 0);
    let fornecedorNome: string | null = null;
    if (occ.fornecedorId) {
      const [f] = await db.select().from(fornecedoresTable).where(sql`id = ${occ.fornecedorId}`);
      fornecedorNome = f?.nome ?? null;
    }
    return { ...occ, fornecedorNome, empresaNome: null, setorNome: null, categoriaNome: null, valorTotal: valorTotal > 0 ? valorTotal : null };
  }));

  const valorTotalMesResult = await db
    .select({ total: sql<number>`coalesce(sum(occ_itens.quantidade::numeric * occ_itens.preco_unitario::numeric), 0)::numeric` })
    .from(occItensTable)
    .innerJoin(occsTable, sql`occ_itens.occ_id = occs.id`)
    .where(sql`occs.criado_em >= date_trunc('month', now())`);

  const gastosPorFornecedorResult = await db.execute(sql`
    SELECT COALESCE(f.nome, 'Sem fornecedor') as nome,
           COALESCE(SUM(oi.quantidade::numeric * oi.preco_unitario::numeric), 0)::float as total
    FROM occ_itens oi
    JOIN occs o ON oi.occ_id = o.id
    LEFT JOIN fornecedores f ON o.fornecedor_id = f.id
    WHERE oi.preco_unitario IS NOT NULL
    GROUP BY f.nome
    ORDER BY total DESC
    LIMIT 6
  `);

  const gastosPorCategoriaResult = await db.execute(sql`
    SELECT COALESCE(c.nome, 'Sem categoria') as nome,
           COALESCE(SUM(oi.quantidade::numeric * oi.preco_unitario::numeric), 0)::float as total
    FROM occ_itens oi
    JOIN occs o ON oi.occ_id = o.id
    LEFT JOIN categorias c ON o.categoria_id = c.id
    WHERE oi.preco_unitario IS NOT NULL
    GROUP BY c.nome
    ORDER BY total DESC
    LIMIT 6
  `);

  const gastosPorMesResult = await db.execute(sql`
    SELECT TO_CHAR(DATE_TRUNC('month', o.criado_em), 'MM/YYYY') as mes,
           COALESCE(SUM(oi.quantidade::numeric * oi.preco_unitario::numeric), 0)::float as total
    FROM occ_itens oi
    JOIN occs o ON oi.occ_id = o.id
    WHERE oi.preco_unitario IS NOT NULL
      AND o.criado_em >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', o.criado_em)
    ORDER BY DATE_TRUNC('month', o.criado_em)
  `);

  res.json({
    totalOccs: totalOccsResult?.count ?? 0,
    totalTemplates: totalTemplatesResult?.count ?? 0,
    totalFornecedores: totalFornecedoresResult?.count ?? 0,
    totalMateriais: totalMateriaisResult?.count ?? 0,
    occsPorStatus: occsPorStatusResult.map(r => ({ status: r.status, total: r.total })),
    templatesPorTipo: templatesPorTipoResult.map(r => ({ tipo: r.tipo, total: r.total })),
    occsRecentes,
    valorTotalMes: valorTotalMesResult[0]?.total ? parseFloat(String(valorTotalMesResult[0].total)) : null,
    gastosPorFornecedor: (gastosPorFornecedorResult.rows as any[]).map(r => ({ nome: String(r.nome), total: parseFloat(String(r.total)) })),
    gastosPorCategoria: (gastosPorCategoriaResult.rows as any[]).map(r => ({ nome: String(r.nome), total: parseFloat(String(r.total)) })),
    gastosPorMes: (gastosPorMesResult.rows as any[]).map(r => ({ mes: String(r.mes), total: parseFloat(String(r.total)) })),
  });
});

export default router;
