import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mizanRouter from "./mizan";
import invitationsRouter from "./invitations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mizanRouter);
router.use(invitationsRouter);

export default router;
