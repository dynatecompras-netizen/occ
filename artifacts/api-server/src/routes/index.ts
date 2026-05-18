import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cnpjRouter from "./cnpj";
import fornecedoresRouter from "./fornecedores";
import materiaisRouter from "./materiais";
import occsRouter from "./occs";
import templatesRouter from "./templates";
import dashboardRouter from "./dashboard";
import precoHistoricoRouter from "./precoHistorico";

const router: IRouter = Router();

router.use("/cnpj", cnpjRouter);
router.use(healthRouter);
router.use(fornecedoresRouter);
router.use(materiaisRouter);
router.use(occsRouter);
router.use(templatesRouter);
router.use(dashboardRouter);
router.use(precoHistoricoRouter);

export default router;
