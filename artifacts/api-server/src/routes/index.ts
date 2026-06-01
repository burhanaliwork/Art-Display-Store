import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paintingsRouter from "./paintings";
import ordersRouter from "./orders";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paintingsRouter);
router.use(ordersRouter);
router.use(adminRouter);

export default router;
