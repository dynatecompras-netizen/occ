import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, empresasTable } from "@workspace/db";
import {
  CreateEmpresaBody,
  UpdateEmpresaParams,
  UpdateEmpresaBody,
  DeleteEmpresaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/empresas", async (_req, res): Promise<void> => {
  const rows = await db.select().from(empresasTable).orderBy(empresasTable.nome);
  res.json(rows);
});

router.post("/empresas", async (req, res): Promise<void> => {
  const parsed = CreateEmpresaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(empresasTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/empresas/:id", async (req, res): Promise<void> => {
  const params = UpdateEmpresaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateEmpresaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(empresasTable).set(parsed.data).where(eq(empresasTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Empresa não encontrada" }); return; }
  res.json(row);
});

router.delete("/empresas/:id", async (req, res): Promise<void> => {
  const params = DeleteEmpresaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(empresasTable).where(eq(empresasTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
