import { Router, type IRouter } from "express";
import { eq, and, ilike, desc, sql, gte, lte, inArray } from "drizzle-orm";
import {
  db,
  occsTable,
  occItensTable,
  occTimelineTable,
  fornecedoresTable,
  materiaisTable,
  precoHistoricoTable,
} from "@workspace/db";

const router: IRouter = Router();

// ─── Status Flow ─────────────────────────────────────────────────────────────
const STATUS_FLOW = [
  "Rascunho", "Enviada", "Em Negociação", "Respondida", "Aprovada",
  "Comprada", "Em Produção", "Em Rota", "Recebida", "Finalizada",
] as const;

type OccStatus = (typeof STATUS_FLOW)[number];

function isValidTransition(from: string, to: string): boolean {
  const fromIdx = STATUS_FLOW.indexOf(from as OccStatus);
  const toIdx = STATUS_FLOW.indexOf(to as OccStatus);
  if (fromIdx === -1 || toIdx === -1) return false;
  // Forward by 1 step
  if (toIdx === fromIdx + 1) return true;
  // Backward by 1 step (but not from Aprovada forward without confirmation)
  if (toIdx === fromIdx - 1) return true;
  return false;
}

// ─── OCC Number Generation ───────────────────────────────────────────────────
async function generateOccNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `OCC-${year}-%`;
  const lastOcc = await db
    .select()
    .from(occsTable)
    .where(sql`${occsTable.numero} LIKE ${pattern}`)
    .orderBy(desc(occsTable.id))
    .limit(1);
  const lastNum = lastOcc[0]
    ? parseInt(lastOcc[0].numero.split("-")[2])
    : 0;
  return `OCC-${year}-${String(lastNum + 1).padStart(5, "0")}`;
}

// ─── Enrich OCC with relations ───────────────────────────────────────────────
async function enrichOcc(occ: typeof occsTable.$inferSelect) {
  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, occ.fornecedorId));

  const itens = await db
    .select()
    .from(occItensTable)
    .where(eq(occItensTable.occId, occ.id));

  const enrichedItens = await Promise.all(
    itens.map(async (item) => {
      const [material] = await db
        .select()
        .from(materiaisTable)
        .where(eq(materiaisTable.id, item.materialId));
      return {
        ...item,
        quantidade: parseFloat(String(item.quantidade)),
        precoUnitario: parseFloat(String(item.precoUnitario || "0")),
        subtotal: parseFloat(String(item.subtotal || "0")),
        materialNome: material?.nome ?? null,
        materialCodigo: material?.codigo ?? null,
        estoqueAtual: material ? parseFloat(String(material.estoqueAtual)) : null,
      };
    }),
  );

  const timeline = await db
    .select()
    .from(occTimelineTable)
    .where(eq(occTimelineTable.occId, occ.id))
    .orderBy(desc(occTimelineTable.criadoEm));

  const valorTotal = enrichedItens.reduce(
    (sum, i) => sum + i.quantidade * i.precoUnitario,
    0,
  );

  return {
    ...occ,
    totalValor: valorTotal > 0 ? String(valorTotal.toFixed(2)) : occ.totalValor,
    fornecedor: fornecedor ?? null,
    fornecedorNome: fornecedor?.razaoSocial ?? null,
    itens: enrichedItens,
    timeline,
  };
}

// ─── List OCCs ───────────────────────────────────────────────────────────────
router.get("/occs", async (req, res): Promise<void> => {
  const {
    status, fornecedorId, prioridade, de, ate, page = "1", limit = "20", search
  } = req.query as Record<string, string | undefined>;

  const conditions = [];
  if (status) {
    const statuses = status.split(",");
    if (statuses.length === 1) {
      conditions.push(eq(occsTable.status, statuses[0]));
    } else {
      conditions.push(inArray(occsTable.status, statuses));
    }
  }
  if (fornecedorId) conditions.push(eq(occsTable.fornecedorId, parseInt(fornecedorId)));
  if (prioridade) conditions.push(eq(occsTable.prioridade, prioridade));
  if (de) conditions.push(gte(occsTable.criadoEm, new Date(de)));
  if (ate) conditions.push(lte(occsTable.criadoEm, new Date(ate)));
  if (search) conditions.push(ilike(occsTable.numero, `%${search}%`));

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(occsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const rows = await db
    .select()
    .from(occsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(occsTable.criadoEm))
    .limit(limitNum)
    .offset(offset);

  const enriched = await Promise.all(
    rows.map(async (occ) => {
      const [fornecedor] = await db
        .select()
        .from(fornecedoresTable)
        .where(eq(fornecedoresTable.id, occ.fornecedorId));
      const itens = await db
        .select()
        .from(occItensTable)
        .where(eq(occItensTable.occId, occ.id));
      const valorTotal = itens.reduce((sum, i) => {
        const qty = parseFloat(String(i.quantidade));
        const price = parseFloat(String(i.precoUnitario || "0"));
        return sum + qty * price;
      }, 0);
      return {
        ...occ,
        fornecedorNome: fornecedor?.razaoSocial ?? null,
        valorTotal: valorTotal > 0 ? valorTotal : parseFloat(String(occ.totalValor || "0")),
        qtdItens: itens.length,
      };
    }),
  );

  res.json({
    data: enriched,
    total: countResult?.count ?? 0,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil((countResult?.count ?? 0) / limitNum),
  });
});

// ─── Get OCC ─────────────────────────────────────────────────────────────────
router.get("/occs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }
  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }
  const enriched = await enrichOcc(occ);
  res.json(enriched);
});

// ─── Create OCC ──────────────────────────────────────────────────────────────
router.post("/occs", async (req, res): Promise<void> => {
  const { fornecedorId, prioridade, dataEntrega, observacoes, itens } = req.body;

  if (!fornecedorId) {
    res.status(400).json({ error: "Fornecedor é obrigatório", code: "VALIDATION_ERROR" });
    return;
  }

  // Check supplier is active
  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, fornecedorId));
  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado", code: "NOT_FOUND" });
    return;
  }
  if (!fornecedor.ativo) {
    res.status(422).json({
      error: "Fornecedor inativo não pode ser vinculado a novas OCCs",
      code: "FORBIDDEN",
    });
    return;
  }

  const numero = await generateOccNumber();

  const [occ] = await db
    .insert(occsTable)
    .values({
      numero,
      fornecedorId,
      prioridade: prioridade || "Normal",
      dataEntrega: dataEntrega || null,
      observacoes: observacoes || null,
      status: "Rascunho",
    })
    .returning();

  // Add timeline entry
  await db.insert(occTimelineTable).values({
    occId: occ.id,
    statusAnterior: null,
    statusNovo: "Rascunho",
    comentario: "OCC criada",
    usuario: "Sistema",
  });

  // Add items if provided
  if (itens && Array.isArray(itens) && itens.length > 0) {
    for (const item of itens.slice(0, 100)) {
      const subtotal = (item.quantidade || 0) * (item.precoUnitario || 0);
      await db.insert(occItensTable).values({
        occId: occ.id,
        materialId: item.materialId,
        quantidade: String(item.quantidade),
        precoUnitario: String(item.precoUnitario || 0),
        unidade: item.unidade || "un",
        subtotal: String(subtotal),
      });
    }
  }

  const enriched = await enrichOcc(occ);
  res.status(201).json(enriched);
});

// ─── Update OCC ──────────────────────────────────────────────────────────────
router.put("/occs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [existing] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  if (!["Rascunho", "Em Negociação"].includes(existing.status)) {
    res.status(422).json({
      error: `OCC no status "${existing.status}" não pode ser editada. Apenas Rascunho ou Em Negociação.`,
      code: "FORBIDDEN",
    });
    return;
  }

  const { fornecedorId, prioridade, dataEntrega, observacoes } = req.body;
  const updates: any = {};
  if (fornecedorId !== undefined) updates.fornecedorId = fornecedorId;
  if (prioridade !== undefined) updates.prioridade = prioridade;
  if (dataEntrega !== undefined) updates.dataEntrega = dataEntrega || null;
  if (observacoes !== undefined) updates.observacoes = observacoes || null;

  const [updated] = await db
    .update(occsTable)
    .set(updates)
    .where(eq(occsTable.id, id))
    .returning();

  res.json(updated);
});

// ─── PATCH Status ────────────────────────────────────────────────────────────
router.patch("/occs/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const { status: newStatus, comentario } = req.body;
  if (!newStatus) {
    res.status(400).json({ error: "Status é obrigatório", code: "VALIDATION_ERROR" });
    return;
  }

  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  if (!isValidTransition(occ.status, newStatus)) {
    res.status(422).json({
      error: `Transição de "${occ.status}" para "${newStatus}" não é permitida. A sequência deve ser seguida.`,
      code: "FORBIDDEN",
    });
    return;
  }

  // Business rule validations
  const itens = await db
    .select()
    .from(occItensTable)
    .where(eq(occItensTable.occId, id));

  // Rascunho → Enviada: needs at least 1 item
  if (occ.status === "Rascunho" && newStatus === "Enviada") {
    if (itens.length === 0) {
      res.status(422).json({
        error: "A OCC precisa ter ao menos 1 item para ser enviada",
        code: "FORBIDDEN",
      });
      return;
    }
    const hasValidQty = itens.every((i) => parseFloat(String(i.quantidade)) > 0);
    if (!hasValidQty) {
      res.status(422).json({
        error: "Todos os itens devem ter quantidade maior que zero",
        code: "FORBIDDEN",
      });
      return;
    }
  }

  // Respondida → Aprovada: all items need price > 0
  if (occ.status === "Respondida" && newStatus === "Aprovada") {
    const hasPrice = itens.every((i) => parseFloat(String(i.precoUnitario || "0")) > 0);
    if (!hasPrice) {
      res.status(422).json({
        error: "Todos os itens devem ter preço unitário definido para aprovar a OCC",
        code: "FORBIDDEN",
      });
      return;
    }
  }

  // Update status
  const [updated] = await db
    .update(occsTable)
    .set({ status: newStatus })
    .where(eq(occsTable.id, id))
    .returning();

  // Add timeline entry
  await db.insert(occTimelineTable).values({
    occId: id,
    statusAnterior: occ.status,
    statusNovo: newStatus,
    comentario: comentario || null,
    usuario: "Sistema",
  });

  // ─── Side effects ──────────────────────────────────────────────────────
  // Aprovada → update estoqueProjetado
  if (newStatus === "Aprovada") {
    for (const item of itens) {
      const qty = parseFloat(String(item.quantidade));
      await db.execute(
        sql`UPDATE materiais SET estoque_projetado = COALESCE(estoque_projetado::numeric, 0) + ${qty} WHERE id = ${item.materialId}`,
      );
    }
  }

  // Recebida → update estoqueAtual
  if (newStatus === "Recebida") {
    for (const item of itens) {
      const qty = parseFloat(String(item.quantidade));
      await db.execute(
        sql`UPDATE materiais SET estoque_atual = COALESCE(estoque_atual::numeric, 0) + ${qty} WHERE id = ${item.materialId}`,
      );
    }
  }

  // Finalizada → auto-create price history
  if (newStatus === "Finalizada") {
    for (const item of itens) {
      const preco = parseFloat(String(item.precoUnitario || "0"));
      if (preco <= 0) continue;

      // Calculate variation
      const [lastPrice] = await db
        .select()
        .from(precoHistoricoTable)
        .where(
          and(
            eq(precoHistoricoTable.materialId, item.materialId),
            eq(precoHistoricoTable.fornecedorId, occ.fornecedorId),
          ),
        )
        .orderBy(desc(precoHistoricoTable.criadoEm))
        .limit(1);

      const previousPrice = lastPrice ? parseFloat(String(lastPrice.preco)) : 0;
      const variacao =
        previousPrice > 0
          ? ((preco - previousPrice) / previousPrice) * 100
          : null;

      await db.insert(precoHistoricoTable).values({
        materialId: item.materialId,
        fornecedorId: occ.fornecedorId,
        occId: occ.id,
        preco: String(preco),
        quantidade: item.quantidade,
        variacao: variacao !== null ? String(variacao.toFixed(2)) : null,
      });
    }

    // Update total value
    const totalValor = itens.reduce((sum, i) => {
      return sum + parseFloat(String(i.quantidade)) * parseFloat(String(i.precoUnitario || "0"));
    }, 0);
    await db
      .update(occsTable)
      .set({ totalValor: String(totalValor.toFixed(2)) })
      .where(eq(occsTable.id, id));
  }

  const enriched = await enrichOcc(updated);
  res.json(enriched);
});

// ─── Duplicate OCC ───────────────────────────────────────────────────────────
router.post("/occs/:id/duplicate", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [original] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!original) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  const numero = await generateOccNumber();
  const [novaOcc] = await db
    .insert(occsTable)
    .values({
      numero,
      fornecedorId: original.fornecedorId,
      status: "Rascunho",
      prioridade: original.prioridade,
      observacoes: original.observacoes,
      dataEntrega: null,
    })
    .returning();

  // Copy items
  const itens = await db
    .select()
    .from(occItensTable)
    .where(eq(occItensTable.occId, id));
  if (itens.length > 0) {
    await db.insert(occItensTable).values(
      itens.map((i) => ({
        occId: novaOcc.id,
        materialId: i.materialId,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        unidade: i.unidade,
        subtotal: i.subtotal,
      })),
    );
  }

  // Timeline
  await db.insert(occTimelineTable).values({
    occId: novaOcc.id,
    statusAnterior: null,
    statusNovo: "Rascunho",
    comentario: `Duplicada a partir de ${original.numero}`,
    usuario: "Sistema",
  });

  const enriched = await enrichOcc(novaOcc);
  res.status(201).json(enriched);
});

// ─── Delete OCC ──────────────────────────────────────────────────────────────
router.delete("/occs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  if (occ.status !== "Rascunho") {
    res.status(422).json({
      error: 'Apenas OCCs com status "Rascunho" podem ser excluídas',
      code: "FORBIDDEN",
    });
    return;
  }

  await db.delete(occTimelineTable).where(eq(occTimelineTable.occId, id));
  await db.delete(occItensTable).where(eq(occItensTable.occId, id));
  await db.delete(occsTable).where(eq(occsTable.id, id));
  res.sendStatus(204);
});

// ─── PDF ─────────────────────────────────────────────────────────────────────
router.get("/occs/:id/pdf", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, id));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  if (occ.status === "Rascunho") {
    res.status(422).json({
      error: 'PDF não disponível para OCCs em status "Rascunho"',
      code: "FORBIDDEN",
    });
    return;
  }

  const enriched = await enrichOcc(occ);

  // Generate simple HTML-based PDF (returned as HTML for browser printing)
  // In production, use pdfkit or jspdf-node for binary PDF
  const { generatePdfHtml } = await import("../lib/pdfGenerator");
  const html = generatePdfHtml(enriched);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ─── OCC Items ───────────────────────────────────────────────────────────────
router.get("/occs/:occId/items", async (req, res): Promise<void> => {
  const occId = parseInt(req.params.occId);
  if (isNaN(occId)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const itens = await db
    .select()
    .from(occItensTable)
    .where(eq(occItensTable.occId, occId));

  const enriched = await Promise.all(
    itens.map(async (item) => {
      const [material] = await db
        .select()
        .from(materiaisTable)
        .where(eq(materiaisTable.id, item.materialId));
      return {
        ...item,
        quantidade: parseFloat(String(item.quantidade)),
        precoUnitario: parseFloat(String(item.precoUnitario || "0")),
        subtotal: parseFloat(String(item.subtotal || "0")),
        materialNome: material?.nome ?? null,
        materialCodigo: material?.codigo ?? null,
      };
    }),
  );

  res.json(enriched);
});

router.post("/occs/:occId/items", async (req, res): Promise<void> => {
  const occId = parseInt(req.params.occId);
  if (isNaN(occId)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, occId));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  // Check item count
  const existingItems = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(occItensTable)
    .where(eq(occItensTable.occId, occId));
  if ((existingItems[0]?.count ?? 0) >= 100) {
    res.status(422).json({
      error: "Máximo de 100 itens por OCC",
      code: "FORBIDDEN",
    });
    return;
  }

  const { materialId, quantidade, precoUnitario, unidade } = req.body;

  if (!materialId || !quantidade || !unidade) {
    res.status(400).json({
      error: "materialId, quantidade e unidade são obrigatórios",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  const subtotal = (quantidade || 0) * (precoUnitario || 0);

  const [item] = await db
    .insert(occItensTable)
    .values({
      occId,
      materialId,
      quantidade: String(quantidade),
      precoUnitario: String(precoUnitario || 0),
      unidade,
      subtotal: String(subtotal),
    })
    .returning();

  // Update OCC total
  await recalcOccTotal(occId);

  const [material] = await db
    .select()
    .from(materiaisTable)
    .where(eq(materiaisTable.id, materialId));

  res.status(201).json({
    ...item,
    quantidade: parseFloat(String(item.quantidade)),
    precoUnitario: parseFloat(String(item.precoUnitario || "0")),
    subtotal: parseFloat(String(item.subtotal || "0")),
    materialNome: material?.nome ?? null,
    materialCodigo: material?.codigo ?? null,
  });
});

router.put("/occs/:occId/items/:itemId", async (req, res): Promise<void> => {
  const occId = parseInt(req.params.occId);
  const itemId = parseInt(req.params.itemId);

  const { quantidade, precoUnitario, unidade } = req.body;

  const updates: any = {};
  if (quantidade !== undefined) updates.quantidade = String(quantidade);
  if (precoUnitario !== undefined) updates.precoUnitario = String(precoUnitario);
  if (unidade !== undefined) updates.unidade = unidade;

  if (updates.quantidade || updates.precoUnitario) {
    const qty = parseFloat(updates.quantidade || "0");
    const price = parseFloat(updates.precoUnitario || "0");
    if (qty && price) updates.subtotal = String(qty * price);
  }

  const [item] = await db
    .update(occItensTable)
    .set(updates)
    .where(eq(occItensTable.id, itemId))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item não encontrado", code: "NOT_FOUND" });
    return;
  }

  await recalcOccTotal(occId);
  res.json({
    ...item,
    quantidade: parseFloat(String(item.quantidade)),
    precoUnitario: parseFloat(String(item.precoUnitario || "0")),
    subtotal: parseFloat(String(item.subtotal || "0")),
  });
});

router.delete("/occs/:occId/items/:itemId", async (req, res): Promise<void> => {
  const occId = parseInt(req.params.occId);
  const itemId = parseInt(req.params.itemId);

  const [occ] = await db.select().from(occsTable).where(eq(occsTable.id, occId));
  if (!occ) {
    res.status(404).json({ error: "OCC não encontrada", code: "NOT_FOUND" });
    return;
  }

  if (!["Rascunho", "Em Negociação"].includes(occ.status)) {
    res.status(422).json({
      error: `Itens não podem ser removidos no status "${occ.status}"`,
      code: "FORBIDDEN",
    });
    return;
  }

  await db.delete(occItensTable).where(eq(occItensTable.id, itemId));
  await recalcOccTotal(occId);
  res.sendStatus(204);
});

// ─── Helper: recalculate OCC total ───────────────────────────────────────────
async function recalcOccTotal(occId: number) {
  const itens = await db
    .select()
    .from(occItensTable)
    .where(eq(occItensTable.occId, occId));
  const total = itens.reduce(
    (sum, i) =>
      sum +
      parseFloat(String(i.quantidade)) *
        parseFloat(String(i.precoUnitario || "0")),
    0,
  );
  await db
    .update(occsTable)
    .set({ totalValor: String(total.toFixed(2)) })
    .where(eq(occsTable.id, occId));
}

export default router;
