import { Router, type IRouter } from "express";
import { AskMizanBody, AskMizanResponse } from "@workspace/api-zod";
import { analyseWedding } from "../lib/mizan";

const router: IRouter = Router();

router.post("/mizan/assistant", (req, res): void => {
  const parsed = AskMizanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid wedding analysis input", details: parsed.error.flatten() });
    return;
  }
  res.json(AskMizanResponse.parse(analyseWedding(parsed.data)));
});

export default router;
