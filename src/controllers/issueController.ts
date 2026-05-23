import type { Request, Response } from "express";
import { pool } from "../config/db"; 
import { StatusCodes } from "http-status-codes";

export const createIssue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { title, description, type } = req.body;
		const reporter_id = req.user!.id;

		const result = await pool.query(
			`INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
			[title, description, type, reporter_id],
		);

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "Issue created successfully",
			data: result.rows[0],
		});
	} catch (error: any) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ success: false, message: error.message });
	}
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
	try {
		const { sort = "newest", type, status } = req.query;

		let query = `SELECT * FROM issues WHERE 1=1`;
		const params: any[] = [];

		if (type) {
			params.push(type);
			query += ` AND type = $${params.length}`;
		}
		if (status) {
			params.push(status);
			query += ` AND status = $${params.length}`;
		}

		query += ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;

		const issuesResult = await pool.query(query, params);
		const issues = issuesResult.rows;

		if (issues.length === 0) {
			res.status(StatusCodes.OK).json({ success: true, data: [] });
			return;
		}
		const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
		const usersResult = await pool.query(
			`SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
			[reporterIds],
		);

		const userMap = usersResult.rows.reduce((acc: any, user: any) => {
			acc[user.id] = user;
			return acc;
		}, {});

		const enrichedIssues = issues.map((issue) => {
			const { reporter_id, ...issueData } = issue;
			return { ...issueData, reporter: userMap[reporter_id] };
		});

		res.status(StatusCodes.OK).json({ success: true, data: enrichedIssues });
	} catch (error: any) {
		res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: error.message });
	}
};

export const getSingleIssue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const issueId = req.params.id;

		const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
			issueId,
		]);
		const issue = issueResult.rows[0];

		if (!issue) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "Issue not found" });
			return;
		}

		// Manual Relationship Resolution
		const userResult = await pool.query(
			`SELECT id, name, role FROM users WHERE id = $1`,
			[issue.reporter_id],
		);

		const { reporter_id, ...issueData } = issue;
		issueData.reporter = userResult.rows[0];

		res.status(StatusCodes.OK).json({ success: true, data: issueData });
	} catch (error: any) {
		res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: error.message });
	}
};

export const updateIssue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const issueId = req.params.id;
		const { title, description, type, status } = req.body;
		const user = req.user!;

		const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
			issueId,
		]);
		const issue = issueCheck.rows[0];

		if (!issue) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "Issue not found" });
			return;
		}

		// Role-based constraints
		if (user.role === "contributor") {
			if (issue.reporter_id !== user.id) {
				res
					.status(StatusCodes.FORBIDDEN)
					.json({ success: false, message: "Cannot edit others issues" });
				return;
			}
			if (issue.status !== "open") {
				res.status(StatusCodes.CONFLICT).json({
					success: false,
					message: "Cannot edit issue unless status is open",
				});
				return;
			}
		}

		const result = await pool.query(
			`UPDATE issues SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        type = COALESCE($3, type), 
        status = COALESCE($4, status), 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $5 RETURNING *`,
			[title, description, type, status, issueId],
		);

		res.status(StatusCodes.OK).json({
			success: true,
			message: "Issue updated successfully",
			data: result.rows[0],
		});
	} catch (error: any) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ success: false, message: error.message });
	}
};

export const deleteIssue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [
			req.params.id,
		]);

		if (result.rowCount === 0) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "Issue not found" });
			return;
		}

		res
			.status(StatusCodes.OK)
			.json({ success: true, message: "Issue deleted successfully" });
	} catch (error: any) {
		res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: error.message });
	}
};
