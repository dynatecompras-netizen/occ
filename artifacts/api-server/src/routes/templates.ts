import { Router, type IRouter } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import {
  db,
  occTemplatesTable,
  templateItensTable,
  fornecedoresTable,
  empresasTable,
  setoresTable,
  categoriasTable,
} from "@workspace/db";
import {
  ListTemplatesQueryParams,
  GetTemplateParams,
  CreateTemplateBody,
  UpdateTemplateParams,
  UpdateTemplateBody,
  DeleteTemplateParams,
  FavoritarTemplateParams,
  FavoritarTemplateBody,
  ListTemplateItensParams,
  CreateTemplateItemParams,
  CreateTemplateItemBody,
  UpdateTemplateItemParams,
  UpdateTemplateItemBody,
  DeleteTemplateItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichTemplate(t: typeof occTemplatesTable.$inferSelect) {
  const [forn] = t.fornecedorPadraoId
    ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, t.fornecedorPadraoId))
    : [null];
  const [emp] = t.empresaId
    ? await db.select().from(empresasTable).where(eq(empresasTable.id, t.empresaId))
    : [null];
  const [setor] = t.setorPadraoId
    ? await db.select().from(setoresTable).where(eq(setoresTable.id, t.setorPadraoId))
    : [null];
  const [cat] = t.categoriaPadraoId
    ? await db.select().from(categoriasTable).where(eq(categoriasTable.id, t.categoriaPadraoId))
    : [null];
  return {
    ...t,
    fornecedorPadraoNome: forn?.nome ?? null,
    empresaNome: emp?.nome ?? null,
    setorPadraoNome: setor?.nome ?? null,
    categoriaPadraoNome: cat?.nome ?? null,
    usoCount: t.usoCount ?? 0,
    ultimoUso: t.ultimoUso ?? null,
  };
}

// ─── List templates ───────────────────────────────────────────────────────────
router.get("/templates/favoritos", async (_req, res): Promise<void> => {
  const rows = await db.select().from(occTemplatesTable)
    .where(and(eq(occTemplatesTable.favorito, true), eq(occTemplatesTable.ativo, true)))
    .orderBy(desc(occTemplatesTable.usoCount));
  const enriched = await Promise.all(rows.map(enrichTemplate));
  res.json(enriched);
});

router.get("/templates/recentes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(occTemplatesTable)
    .where(eq(occTemplatesTable.ativo, true))
    .orderBy(desc(occTemplatesTable.ultimoUso))
    .limit(10);
  const enriched = await Promise.all(rows.filter(r => r.ultimoUso != null).map(enrichTemplate));
  res.json(enriched);
});

router.get("/templates", async (req, res): Promise<void> => {
  const query = ListTemplatesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.tipo) conditions.push(eq(occTemplatesTable.tipo, query.data.tipo));
  if (query.data.fornecedorId) conditions.push(eq(occTemplatesTable.fornecedorPadraoId, query.data.fornecedorId));
  if (query.data.setorId) conditions.push(eq(occTemplatesTable.setorPadraoId, query.data.setorId));
  if (query.data.categoriaId) conditions.push(eq(occTemplatesTable.categoriaPadraoId, query.data.categoriaId));
  if (query.data.search) conditions.push(ilike(occTemplatesTable.nome, `%${query.data.search}%`));
  if (query.data.ativo !== undefined) conditions.push(eq(occTemplatesTable.ativo, query.data.ativo));
  if (query.data.favorito !== undefined) conditions.push(eq(occTemplatesTable.favorito, query.data.favorito));
  const rows = await db.select().from(occTemplatesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(occTemplatesTable.criadoEm));
  const enriched = await Promise.all(rows.map(enrichTemplate));
  res.json(enriched);
});

router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [template] = await db.insert(occTemplatesTable).values(parsed.data).returning();
  const enriched = await enrichTemplate(template);
  res.status(201).json(enriched);
});

// ─── Get template ─────────────────────────────────────────────────────────────
router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [template] = await db.select().from(occTemplatesTable).where(eq(occTemplatesTable.id, params.data.id));
  if (!template) { res.status(404).json({ error: "Template não encontrado" }); return; }
  const enriched = await enrichTemplate(template);
  const itens = await db.select().from(templateItensTable).where(eq(templateItensTable.templateId, params.data.id));
  const enrichedItens = await Promise.all(itens.map(async (i) => {
    const [fPref] = i.fornecedorPreferencialId
      ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, i.fornecedorPreferencialId))
      : [null];
    return { ...i, quantidadePadrao: parseFloat(String(i.quantidadePadrao)), fornecedorPreferencialNome: fPref?.nome ?? null };
  }));
  res.json({ ...enriched, itens: enrichedItens });
});

router.patch("/templates/:id", async (req, res): Promise<void> => {
  const params = UpdateTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [template] = await db.update(occTemplatesTable).set(parsed.data).where(eq(occTemplatesTable.id, params.data.id)).returning();
  if (!template) { res.status(404).json({ error: "Template não encontrado" }); return; }
  const enriched = await enrichTemplate(template);
  res.json(enriched);
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const params = DeleteTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(templateItensTable).where(eq(templateItensTable.templateId, params.data.id));
  await db.delete(occTemplatesTable).where(eq(occTemplatesTable.id, params.data.id));
  res.sendStatus(204);
});

router.patch("/templates/:id/favoritar", async (req, res): Promise<void> => {
  const params = FavoritarTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = FavoritarTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [template] = await db.update(occTemplatesTable)
    .set({ favorito: parsed.data.favorito })
    .where(eq(occTemplatesTable.id, params.data.id))
    .returning();
  if (!template) { res.status(404).json({ error: "Template não encontrado" }); return; }
  const enriched = await enrichTemplate(template);
  res.json(enriched);
});

// ─── Template Itens ───────────────────────────────────────────────────────────
router.get("/templates/:templateId/itens", async (req, res): Promise<void> => {
  const params = ListTemplateItensParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const itens = await db.select().from(templateItensTable).where(eq(templateItensTable.templateId, params.data.templateId));
  const enriched = await Promise.all(itens.map(async (i) => {
    const [fPref] = i.fornecedorPreferencialId
      ? await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, i.fornecedorPreferencialId))
      : [null];
    return { ...i, quantidadePadrao: parseFloat(String(i.quantidadePadrao)), fornecedorPreferencialNome: fPref?.nome ?? null };
  }));
  res.json(enriched);
});

router.post("/templates/:templateId/itens", async (req, res): Promise<void> => {
  const params = CreateTemplateItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateTemplateItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.insert(templateItensTable).values({
    templateId: params.data.templateId,
    ...parsed.data,
    quantidadePadrao: String(parsed.data.quantidadePadrao),
  }).returning();
  res.status(201).json({ ...item, quantidadePadrao: parseFloat(String(item.quantidadePadrao)), fornecedorPreferencialNome: null });
});

router.patch("/templates/:templateId/itens/:id", async (req, res): Promise<void> => {
  const params = UpdateTemplateItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTemplateItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.quantidadePadrao !== undefined) {
    updateData.quantidadePadrao = String(parsed.data.quantidadePadrao);
  }
  const [item] = await db.update(templateItensTable).set(updateData).where(eq(templateItensTable.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Item não encontrado" }); return; }
  res.json({ ...item, quantidadePadrao: parseFloat(String(item.quantidadePadrao)), fornecedorPreferencialNome: null });
});

router.delete("/templates/:templateId/itens/:id", async (req, res): Promise<void> => {
  const params = DeleteTemplateItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(templateItensTable).where(eq(templateItensTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
