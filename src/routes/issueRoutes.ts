import { Router } from "express";
import {
	createIssue,
	getIssues,
	getSingleIssue,
	updateIssue,
	deleteIssue,
} from "../controllers/issueController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validateIssue } from "../middlewares/validator.js";

const router = Router();

router.get("/", getIssues);
router.get("/:id", getSingleIssue);
router.post("/", authenticate, validateIssue, createIssue); 
router.patch("/:id", authenticate, validateIssue, updateIssue);
router.delete("/:id", authenticate, requireRole(["maintainer"]), deleteIssue);

export default router;
