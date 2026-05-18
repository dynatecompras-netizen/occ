import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, templatesTable, fornecedoresTable, occsTable, occItensTable, occTimelineTable } from "@workspace/db";

const router: IRouter = Router();

async function generateOccNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `OCC-${year}-%`;
  const lastOcc = await db.select().from(occsTable)
    .where(sql`${occsTable.numero} LIKE ${pattern}`)
    .orderBy(desc(occsTable.id)).limit(1);
  const lastNum = lastOcc[0] ? parseInt(lastOcc[0].numero.split("-")[2]) : 0;
  return `OCC-${year}-${String(lastNum + 1).padStart(5, "0")}`;
}

router.get("/templates", async (_req, res): Promise<void> => {
  const rows = await db.select().from(templatesTable).orderBy(desc(templatesTable.criadoEm));
  const enriched = await Promise.all(rows.map(async (t) => {
    let fornecedorNome: string | null = null;
    if (t.fornecedorId) {
      const [f] = await db.select().from(fornecedoresTable).where(eq(fornecedoresTable.id, t.fornecedorId));
      fornecedorNome = f?.razaoSocial ?? null;
    }
    return { ...t, fornecedorNome };
  }));
  res.json(enriched);
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  const [template] = await db.select().from(templatesTable).where(eq(templatesTable.id, id));
  if (!template) { res.status(404).json({ error: "Template não encontrado", code: "NOT_FOUND" }); return; }
  res.json(template);
});

router.post("/templates", async (req, res): Promise<void> => {
  const { nome, descricao, tipo, fornecedorId, itens } = req.body;
  if (!nome) { res.status(400).json({ error: "Nome é obrigatório", code: "VALIDATION_ERROR" }); return; }
  const [template] = await db.insert(templatesTable).values({
    nome, descricao: descricao || null, tipo: tipo || "Padrão",
    fornecedorId: fornecedorId || null, itens: itens || [],
  }).returning();
  res.status(201).json(template);
});

router.put("/templates/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  const { nome, descricao, tipo, fornecedorId, itens } = req.body;
  const updates: any = {};
  if (nome !== undefined) updates.nome = nome;
  if (descricao !== undefined) updates.descricao = descricao || null;
  if (tipo !== undefined) updates.tipo = tipo;
  if (fornecedorId !== undefined) updates.fornecedorId = fornecedorId || null;
  if (itens !== undefined) updates.itens = itens;
  const [updated] = await db.update(templatesTable).set(updates).where(eq(templatesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Template não encontrado", code: "NOT_FOUND" }); return; }
  res.json(updated);
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  const [template] = await db.select().from(templatesTable).where(eq(templatesTable.id, id));
  if (!template) { res.status(404).json({ error: "Template não encontrado", code: "NOT_FOUND" }); return; }
  
  const { fornecedorId, prioridade, observacoes } = req.body;
  const fId = fornecedorId || template.fornecedorId;
  if (!fId) { res.status(400).json({ error: "Fornecedor é obrigatório", code: "VALIDATION_ERROR" }); return; }
  
  const numero = await generateOccNumber();
  const [novaOcc] = await db.insert(occsTable).values({
    numero, fornecedorId: fId, status: "Rascunho",
    prioridade: prioridade || "Normal", observacoes: observacoes || null,
  }).returning();

  const templateItens = (template.itens as any[]) || [];
  for (const item of templateItens) {
    await db.insert(occItensTable).values({
      occId: novaOcc.id, materialId: item.materialId,
      quantidade: String(item.quantidade || 1), precoUnitario: "0",
      unidade: item.unidade || "un", subtotal: "0",
    });
  }

  await db.insert(occTimelineTable).values({
    occId: novaOcc.id, statusAnterior: null, statusNovo: "Rascunho",
    comentario: `Criada a partir do template "${template.nome}"`, usuario: "Sistema",
  });

  await db.update(templatesTable)
    .set({ contagemUso: (template.contagemUso || 0) + 1 })
    .where(eq(templatesTable.id, id));

  res.status(201).json(novaOcc);
});

router.patch("/templates/:id/favorite", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  const { favorito } = req.body;
  const [updated] = await db.update(templatesTable).set({ favorito: !!favorito }).where(eq(templatesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Template não encontrado", code: "NOT_FOUND" }); return; }
  res.json(updated);
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" }); return; }
  await db.delete(templatesTable).where(eq(templatesTable.id, id));
  res.sendStatus(204);
});

export default router;
