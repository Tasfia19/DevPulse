import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

export const authenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ success: false, message: "No token provided" });
		return;
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
		req.user = decoded as any;
		next();
	} catch (error) {
		res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ success: false, message: "Invalid or expired token" });
	}
};

export const requireRole = (roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user || !roles.includes(req.user.role)) {
			res
				.status(StatusCodes.FORBIDDEN)
				.json({ success: false, message: "Insufficient permissions" });
			return;
		}
		next();
	};
};
