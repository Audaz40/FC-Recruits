import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import clubsRouter from "./clubs";
import tryoutsRouter from "./tryouts";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(clubsRouter);
router.use(tryoutsRouter);
router.use(notificationsRouter);
router.use(statsRouter);

export default router;
