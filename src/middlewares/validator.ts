import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const validateIssue = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { title, description, type, status } = req.body;

	if (title && (title.length === 0 || title.length > 150)) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({
				success: false,
				message: "Title must be between 1 and 150 characters",
			});
		return;
	}

	if (description && description.length < 20) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({
				success: false,
				message: "Description must be at least 20 characters long",
			});
		return;
	}

	if (type && !["bug", "feature_request"].includes(type)) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ success: false, message: "Type must be bug or feature_request" });
		return;
	}

	if (status && !["open", "in_progress", "resolved"].includes(status)) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ success: false, message: "Invalid status value" });
		return;
	}

	next();
};
