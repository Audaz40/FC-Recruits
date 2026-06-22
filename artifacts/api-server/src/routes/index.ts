import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import clubsRouter from "./clubs";
import tryoutsRouter from "./tryouts";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(clubsRouter);
router.use(tryoutsRouter);
router.use(notificationsRouter);
router.use(statsRouter);
router.use(reportsRouter);

export default router;
