import { Request } from "express";

export {};

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
				name: string;
				role: "contributor" | "maintainer";
			};
		}
	}
}
