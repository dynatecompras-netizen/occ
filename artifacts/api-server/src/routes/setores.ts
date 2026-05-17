import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, setoresTable } from "@workspace/db";
import {
  CreateSetorBody,
  UpdateSetorParams,
  UpdateSetorBody,
  DeleteSetorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/setores", async (_req, res): Promise<void> => {
  const rows = await db.select().from(setoresTable).orderBy(setoresTable.nome);
  res.json(rows);
});

router.post("/setores", async (req, res): Promise<void> => {
  const parsed = CreateSetorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(setoresTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/setores/:id", async (req, res): Promise<void> => {
  const params = UpdateSetorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateSetorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(setoresTable).set(parsed.data).where(eq(setoresTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Setor não encontrado" }); return; }
  res.json(row);
});

router.delete("/setores/:id", async (req, res): Promise<void> => {
  const params = DeleteSetorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(setoresTable).where(eq(setoresTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
