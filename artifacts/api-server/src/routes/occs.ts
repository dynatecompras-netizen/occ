import { Router, type IRouter } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import {
  db,
  occsTable,
  occItensTable,
  fornecedoresTable,
  empresasTable,
  setoresTable,
  categoriasTable,
  historicosPrecosTable,
} from "@workspace/db";
import {
  ListOccsQueryParams,
  GetOccParams,
  CreateOccBody,
  UpdateOccParams,
  UpdateOccBody,
  DeleteOccParams,
  DuplicarOccParams,
  SalvarOccComoTemplateParams,
  SalvarOccComoTemplateBody,
  CriarOccDeTemplateParams,
  CriarOccDeTemplateBody,
  ListOccItensParams,
  CreateOccItemParams,
  CreateOccItemBody,
  UpdateOccItemParams,
  UpdateOccItemBody,
  DeleteOccItemParams,
} from "@workspace/api-zod";
import { occTemplatesTable, templateItensTable } from "@workspace/db";

const router: IRouter = Router();

function generateOccNumero(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OCC-${year}${month}-${rand}`;
}

async function enrichOcc(occ: typeof occsTable.$inferSelect) {
  const [fornecedor] = occ.fornecedorId
    ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, occ.fornecedorId))
    : [null];
  const [empresa] = occ.empresaId
    ? await db.select().from(empresasTable).where(eq(empresasTable.id, occ.empresaId))
    : [null];
  const [setor] = occ.setorId
    ? await db.select().from(setoresTable).where(eq(setoresTable.id, occ.setorId))
    : [null];
  const [categoria] = occ.categoriaId
    ? await db.select().from(categoriasTable).where(eq(categoriasTable.id, occ.categoriaId))
    : [null];
  const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, occ.id));
  const enrichedItens = await Promise.all(itens.map(async (item) => {
    const [fPref] = item.fornecedorPreferencialId
      ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, item.fornecedorPreferencialId))
      : [null];
    return {
      ...item,
      quantidade: parseFloat(String(item.quantidade)),
      precoUnitario: item.precoUnitario != null ? parseFloat(String(item.precoUnitario)) : null,
      fornecedorPreferencialNome: fPref?.nome ?? null,
    };
  }));
  const valorTotal = enrichedItens.reduce((sum, i) => sum + (i.quantidade * (i.precoUnitario ?? 0)), 0);
  return {
    ...occ,
    fornecedorNome: fornecedor?.nome ?? null,
    empresaNome: empresa?.nome ?? null,
    setorNome: setor?.nome ?? null,
    categoriaNome: categoria?.nome ?? null,
    valorTotal: valorTotal > 0 ? valorTotal : null,
    itens: enrichedItens,
  };
}

// ─── List OCCs ───────────────────────────────────────────────────────────────
router.get("/occs", async (req, res): Promise<void> => {
  const query = ListOccsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.status) conditions.push(eq(occsTable.status, query.data.status));
  if (query.data.fornecedorId) conditions.push(eq(occsTable.fornecedorId, query.data.fornecedorId));
  if (query.data.setorId) conditions.push(eq(occsTable.setorId, query.data.setorId));
  if (query.data.categoriaId) conditions.push(eq(occsTable.categoriaId, query.data.categoriaId));
  if (query.data.search) conditions.push(ilike(occsTable.numero, `%${query.data.search}%`));
  const rows = await db.select().from(occsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(occsTable.criadoEm));
  const enriched = await Promise.all(rows.map(async (occ) => {
    const [fornecedor] = occ.fornecedorId
      ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, occ.fornecedorId))
      : [null];
    const [empresa] = occ.empresaId
      ? await db.select().from(empresasTable).where(eq(empresasTable.id, occ.empresaId))
      : [null];
    const [setor] = occ.setorId
      ? await db.select().from(setoresTable).where(eq(setoresTable.id, occ.setorId))
      : [null];
    const [categoria] = occ.categoriaId
      ? await db.select().from(categoriasTable).where(eq(categoriasTable.id, occ.categoriaId))
      : [null];
    const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, occ.id));
    const valorTotal = itens.reduce((sum, i) => {
      const qty = parseFloat(String(i.quantidade));
      const price = i.precoUnitario != null ? parseFloat(String(i.precoUnitario)) : 0;
      return sum + qty * price;
    }, 0);
    return {
      ...occ,
      fornecedorNome: fornecedor?.nome ?? null,
      empresaNome: empresa?.nome ?? null,
      setorNome: setor?.nome ?? null,
      categoriaNome: categoria?.nome ?? null,
      valorTotal: valorTotal > 0 ? valorTotal : null,
    };
  }));
  res.json(enriched);
});

// ─── Create OCC ──────────────────────────────────────────────────────────────
router.post("/occs", async (req, res): Promise<void> => {
  const parsed = CreateOccBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  let numero = generateOccNumero();
  const [existing] = await db.select().from(occsTable).where(eq(occsTable.numero, numero));
  if (existing) numero = generateOccNumero() + "-" + Date.now();
  const [occ] = await db.insert(occsTable).values({ ...parsed.data, numero }).returning();
  const enriched = await enrichOcc(occ);
  res.status(201).json({ ...enriched, itens: undefined });
});

// ─── Get OCC (must be before /:id/duplicar) ──────────────────────────────────
router.get("/occs/:id", async (req, res): Promise<void> => {
  const params = GetOccParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, params.data.id));
  if (!occ) { res.status(404).json({ error: "OCC não encontrada" }); return; }
  const enriched = await enrichOcc(occ);
  res.json(enriched);
});

// ─── Update OCC ──────────────────────────────────────────────────────────────
router.patch("/occs/:id", async (req, res): Promise<void> => {
  const params = UpdateOccParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateOccBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [occ] = await db.update(occsTable).set(parsed.data).where(eq(occsTable.id, params.data.id)).returning();
  if (!occ) { res.status(404).json({ error: "OCC não encontrada" }); return; }
  res.json(occ);
});

// ─── Delete OCC ──────────────────────────────────────────────────────────────
router.delete("/occs/:id", async (req, res): Promise<void> => {
  const params = DeleteOccParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(occItensTable).where(eq(occItensTable.occId, params.data.id));
  await db.delete(occsTable).where(eq(occsTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── Duplicar OCC ────────────────────────────────────────────────────────────
router.post("/occs/:id/duplicar", async (req, res): Promise<void> => {
  const params = DuplicarOccParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [original] = await db.select().from(occsTable).where(eq(occsTable.id, params.data.id));
  if (!original) { res.status(404).json({ error: "OCC não encontrada" }); return; }
  const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, params.data.id));
  const numero = generateOccNumero();
  const [novaOcc] = await db.insert(occsTable).values({
    numero,
    fornecedorId: original.fornecedorId,
    empresaId: original.empresaId,
    setorId: original.setorId,
    categoriaId: original.categoriaId,
    status: "Rascunho",
    prioridade: original.prioridade,
    observacoes: original.observacoes,
    condicoesPagamento: original.condicoesPagamento,
    prazo: original.prazo,
    layoutPdf: original.layoutPdf,
  }).returning();
  if (itens.length > 0) {
    await db.insert(occItensTable).values(itens.map(i => ({
      occId: novaOcc.id,
      materialId: i.materialId,
      nomeMaterial: i.nomeMaterial,
      unidade: i.unidade,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      observacao: i.observacao,
      fornecedorPreferencialId: i.fornecedorPreferencialId,
    })));
  }
  const enriched = await enrichOcc(novaOcc);
  res.status(201).json(enriched);
});

// ─── Salvar como Template ────────────────────────────────────────────────────
router.post("/occs/:id/salvar-como-template", async (req, res): Promise<void> => {
  const params = SalvarOccComoTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SalvarOccComoTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, params.data.id));
  if (!occ) { res.status(404).json({ error: "OCC não encontrada" }); return; }
  const [template] = await db.insert(occTemplatesTable).values({
    nome: parsed.data.nome,
    descricao: parsed.data.descricao ?? null,
    tipo: parsed.data.tipo,
    fornecedorPadraoId: occ.fornecedorId,
    empresaId: occ.empresaId,
    setorPadraoId: occ.setorId,
    categoriaPadraoId: occ.categoriaId,
    prioridade: occ.prioridade,
    observacoesPadrao: occ.observacoes,
    condicoesPagamento: occ.condicoesPagamento,
    prazoPadrao: occ.prazo,
    layoutPdf: occ.layoutPdf,
  }).returning();
  if (parsed.data.tipo === "completo") {
    const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, occ.id));
    if (itens.length > 0) {
      await db.insert(templateItensTable).values(itens.map(i => ({
        templateId: template.id,
        materialId: i.materialId,
        nomeMaterial: i.nomeMaterial,
        unidade: i.unidade,
        quantidadePadrao: String(i.quantidade),
        observacao: i.observacao,
        fornecedorPreferencialId: i.fornecedorPreferencialId,
      })));
    }
  }
  res.status(201).json({ ...template, usoCount: template.usoCount ?? 0, ultimoUso: template.ultimoUso ?? null });
});

// ─── Criar OCC de Template ───────────────────────────────────────────────────
router.post("/occs/from-template/:templateId", async (req, res): Promise<void> => {
  const params = CriarOccDeTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CriarOccDeTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [template] = await db.select().from(occTemplatesTable).where(eq(occTemplatesTable.id, params.data.templateId));
  if (!template) { res.status(404).json({ error: "Template não encontrado" }); return; }
  const numero = generateOccNumero();
  const [novaOcc] = await db.insert(occsTable).values({
    numero,
    fornecedorId: parsed.data.fornecedorId ?? template.fornecedorPadraoId,
    empresaId: parsed.data.empresaId ?? template.empresaId,
    setorId: parsed.data.setorId ?? template.setorPadraoId,
    categoriaId: parsed.data.categoriaId ?? template.categoriaPadraoId,
    status: "Rascunho",
    prioridade: parsed.data.prioridade ?? template.prioridade ?? "Normal",
    observacoes: parsed.data.observacoes ?? template.observacoesPadrao,
    condicoesPagamento: template.condicoesPagamento,
    prazo: template.prazoPadrao,
    layoutPdf: template.layoutPdf,
  }).returning();
  if (template.tipo === "completo") {
    const tItens = await db.select().from(templateItensTable).where(eq(templateItensTable.templateId, template.id));
    if (tItens.length > 0) {
      await db.insert(occItensTable).values(tItens.map(i => ({
        occId: novaOcc.id,
        materialId: i.materialId,
        nomeMaterial: i.nomeMaterial,
        unidade: i.unidade,
        quantidade: i.quantidadePadrao,
        observacao: i.observacao,
        fornecedorPreferencialId: i.fornecedorPreferencialId,
      })));
    }
  }
  await db.update(occTemplatesTable)
    .set({ usoCount: (template.usoCount ?? 0) + 1, ultimoUso: new Date() })
    .where(eq(occTemplatesTable.id, template.id));
  const enriched = await enrichOcc(novaOcc);
  res.status(201).json(enriched);
});

// ─── OCC Itens ───────────────────────────────────────────────────────────────
router.get("/occs/:occId/itens", async (req, res): Promise<void> => {
  const params = ListOccItensParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const itens = await db.select().from(occItensTable).where(eq(occItensTable.occId, params.data.occId));
  const enriched = await Promise.all(itens.map(async (i) => {
    const [fPref] = i.fornecedorPreferencialId
      ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, i.fornecedorPreferencialId))
      : [null];
    return {
      ...i,
      quantidade: parseFloat(String(i.quantidade)),
      precoUnitario: i.precoUnitario != null ? parseFloat(String(i.precoUnitario)) : null,
      fornecedorPreferencialNome: fPref?.nome ?? null,
    };
  }));
  res.json(enriched);
});

router.post("/occs/:occId/itens", async (req, res): Promise<void> => {
  const params = CreateOccItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateOccItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, params.data.occId));
  if (!occ) { res.status(404).json({ error: "OCC não encontrada" }); return; }
  const [item] = await db.insert(occItensTable).values({
    occId: params.data.occId,
    ...parsed.data,
  }).returning();
  if (parsed.data.precoUnitario && parsed.data.materialId) {
    await db.insert(historicosPrecosTable).values({
      materialId: parsed.data.materialId,
      fornecedorId: occ.fornecedorId ?? null,
      preco: String(parsed.data.precoUnitario),
      occId: occ.id,
      occNumero: occ.numero,
    });
  }
  res.status(201).json({
    ...item,
    quantidade: parseFloat(String(item.quantidade)),
    precoUnitario: item.precoUnitario != null ? parseFloat(String(item.precoUnitario)) : null,
    fornecedorPreferencialNome: null,
  });
});

router.patch("/occs/:occId/itens/:id", async (req, res): Promise<void> => {
  const params = UpdateOccItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateOccItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.update(occItensTable).set(parsed.data).where(eq(occItensTable.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Item não encontrado" }); return; }
  res.json({
    ...item,
    quantidade: parseFloat(String(item.quantidade)),
    precoUnitario: item.precoUnitario != null ? parseFloat(String(item.precoUnitario)) : null,
    fornecedorPreferencialNome: null,
  });
});

router.delete("/occs/:occId/itens/:id", async (req, res): Promise<void> => {
  const params = DeleteOccItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(occItensTable).where(eq(occItensTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
