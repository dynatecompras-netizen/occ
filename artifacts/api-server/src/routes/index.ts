import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fornecedoresRouter from "./fornecedores";
import empresasRouter from "./empresas";
import setoresRouter from "./setores";
import categoriasRouter from "./categorias";
import materiaisRouter from "./materiais";
import occsRouter from "./occs";
import templatesRouter from "./templates";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fornecedoresRouter);
router.use(empresasRouter);
router.use(setoresRouter);
router.use(categoriasRouter);
router.use(materiaisRouter);
router.use(occsRouter);
router.use(templatesRouter);
router.use(dashboardRouter);

export default router;
