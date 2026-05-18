import { Router, type IRouter } from "express";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { db, fornecedoresTable, occsTable } from "@workspace/db";

const router: IRouter = Router();

// ─── CNPJ Validation (mod-11 algorithm) ──────────────────────────────────────
function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calc = (digits: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(digits, w1);
  if (parseInt(digits[12]) !== d1) return false;

  const d2 = calc(digits, w2);
  if (parseInt(digits[13]) !== d2) return false;

  return true;
}

// ─── List Fornecedores ───────────────────────────────────────────────────────
router.get("/fornecedores", async (req, res): Promise<void> => {
  const { ativo, search } = req.query as Record<string, string | undefined>;

  const conditions = [];
  if (ativo !== undefined) {
    conditions.push(eq(fornecedoresTable.ativo, ativo === "true"));
  }
  if (search) {
    conditions.push(
      sql`(${ilike(fornecedoresTable.razaoSocial, `%${search}%`)} OR ${ilike(fornecedoresTable.cnpj, `%${search}%`)} OR ${fornecedoresTable.nomeFantasia} ILIKE ${`%${search}%`})`,
    );
  }

  const rows = await db
    .select()
    .from(fornecedoresTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(fornecedoresTable.criadoEm));

  res.json(rows);
});

// ─── Get Fornecedor ──────────────────────────────────────────────────────────
router.get("/fornecedores/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, id));
  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado", code: "NOT_FOUND" });
    return;
  }

  // Get linked OCCs
  const linkedOccs = await db
    .select()
    .from(occsTable)
    .where(eq(occsTable.fornecedorId, id))
    .orderBy(desc(occsTable.criadoEm));

  res.json({ ...fornecedor, occs: linkedOccs });
});

// ─── Create Fornecedor ───────────────────────────────────────────────────────
router.post("/fornecedores", async (req, res): Promise<void> => {
  const {
    razaoSocial, nomeFantasia, cnpj, email, telefone,
    whatsapp, endereco, cidade, estado, cep, observacoes,
  } = req.body;

  if (!razaoSocial || !cnpj) {
    res.status(400).json({
      error: "Razão Social e CNPJ são obrigatórios",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Validate CNPJ format and check digit
  if (!validateCNPJ(cnpj)) {
    res.status(400).json({
      error: "CNPJ inválido",
      code: "VALIDATION_ERROR",
      details: [{ field: "cnpj", message: "Dígitos verificadores do CNPJ não conferem" }],
    });
    return;
  }

  // Check unique CNPJ
  const [existing] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.cnpj, cnpj));
  if (existing) {
    res.status(409).json({
      error: "CNPJ já cadastrado no sistema",
      code: "CONFLICT",
      details: [{ field: "cnpj", message: `CNPJ ${cnpj} já está cadastrado` }],
    });
    return;
  }

  const [fornecedor] = await db
    .insert(fornecedoresTable)
    .values({
      razaoSocial,
      nomeFantasia: nomeFantasia || null,
      cnpj,
      email: email || null,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      endereco: endereco || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
      observacoes: observacoes || null,
    })
    .returning();

  res.status(201).json(fornecedor);
});

// ─── Update Fornecedor ───────────────────────────────────────────────────────
router.put("/fornecedores/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [existing] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Fornecedor não encontrado", code: "NOT_FOUND" });
    return;
  }

  const {
    razaoSocial, nomeFantasia, cnpj, email, telefone,
    whatsapp, endereco, cidade, estado, cep, observacoes,
  } = req.body;

  // If CNPJ changed, validate and check unique
  if (cnpj && cnpj !== existing.cnpj) {
    if (!validateCNPJ(cnpj)) {
      res.status(400).json({
        error: "CNPJ inválido",
        code: "VALIDATION_ERROR",
        details: [{ field: "cnpj", message: "Dígitos verificadores do CNPJ não conferem" }],
      });
      return;
    }
    const [dup] = await db
      .select()
      .from(fornecedoresTable)
      .where(eq(fornecedoresTable.cnpj, cnpj));
    if (dup) {
      res.status(409).json({
        error: "CNPJ já cadastrado no sistema",
        code: "CONFLICT",
      });
      return;
    }
  }

  const updates: any = {};
  if (razaoSocial !== undefined) updates.razaoSocial = razaoSocial;
  if (nomeFantasia !== undefined) updates.nomeFantasia = nomeFantasia || null;
  if (cnpj !== undefined) updates.cnpj = cnpj;
  if (email !== undefined) updates.email = email || null;
  if (telefone !== undefined) updates.telefone = telefone || null;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp || null;
  if (endereco !== undefined) updates.endereco = endereco || null;
  if (cidade !== undefined) updates.cidade = cidade || null;
  if (estado !== undefined) updates.estado = estado || null;
  if (cep !== undefined) updates.cep = cep || null;
  if (observacoes !== undefined) updates.observacoes = observacoes || null;

  const [updated] = await db
    .update(fornecedoresTable)
    .set(updates)
    .where(eq(fornecedoresTable.id, id))
    .returning();

  res.json(updated);
});

// ─── Delete Fornecedor (soft delete) ─────────────────────────────────────────
router.delete("/fornecedores/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido", code: "VALIDATION_ERROR" });
    return;
  }

  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, id));
  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado", code: "NOT_FOUND" });
    return;
  }

  // Check active OCCs
  const activeStatuses = ["Enviada", "Em Negociação", "Respondida", "Aprovada", "Comprada", "Em Produção", "Em Rota"];
  const activeOccs = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(occsTable)
    .where(
      and(
        eq(occsTable.fornecedorId, id),
        sql`${occsTable.status} = ANY(${activeStatuses})`,
      ),
    );

  if ((activeOccs[0]?.count ?? 0) > 0) {
    res.status(422).json({
      error: "Fornecedor possui OCCs ativas e não pode ser inativado",
      code: "FORBIDDEN",
    });
    return;
  }

  // Soft delete
  await db
    .update(fornecedoresTable)
    .set({ ativo: false })
    .where(eq(fornecedoresTable.id, id));

  res.sendStatus(204);
});

export default router;
