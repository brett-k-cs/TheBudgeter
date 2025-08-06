import { Request, Response, Router } from "express";

import { Account } from "../models/account.js";

const router = Router();

interface AccountRequestBody {
    name: string;
    type: "checking" | "savings" | "credit card" | "investment" | "other";
    balance?: number;
    description?: string;
}

// Get all accounts for user
router.get("/", async (req, res) => {
    try {
        const accounts = await Account.findAll({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
            order: [["createdAt", "DESC"]],
        });

        res.json({ success: true, data: accounts });
    } catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get single account
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const accountId = parseInt(req.params.id, 10);

    if (isNaN(accountId)) {
        res.status(400).json({ error: "Invalid account ID" });
        return;
    }

    try {
        const account = await Account.findOne({
            where: {
                id: accountId,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!account) {
            res.status(404).json({ error: "Account not found" });
            return;
        }

        res.json({ success: true, data: account });
    } catch (error) {
        console.error("Error fetching account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create new account
router.post(
    "/",
    async (req: Request<{}, {}, AccountRequestBody>, res: Response) => {
        const { name, type, balance = 0, description } = req.body;

        if (!name || !type) {
            res.status(400).json({ error: "Name and type are required" });
            return;
        }

        if (
            ![
                "checking",
                "savings",
                "credit card",
                "investment",
                "other",
            ].includes(type)
        ) {
            res.status(400).json({ error: "Invalid account type" });
            return;
        }

        if (balance && (typeof balance !== "number" || balance < 0)) {
            res.status(400).json({
                error: "Balance must be a non-negative number",
            });
            return;
        }

        try {
            const account = await Account.create({
                userId: req.user!.id,
                name,
                type,
                balance,
                description,
            });

            res.status(201).json({ success: true, data: account });
        } catch (error) {
            console.error("Error creating account:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Update account
router.put(
    "/:id",
    async (
        req: Request<{ id: string }, {}, AccountRequestBody>,
        res: Response
    ) => {
        const accountId = parseInt(req.params.id, 10);
        const { name, type, balance, description } = req.body;

        if (isNaN(accountId)) {
            res.status(400).json({ error: "Invalid account ID" });
            return;
        }

        if (!name || !type) {
            res.status(400).json({ error: "Name and type are required" });
            return;
        }

        if (
            ![
                "checking",
                "savings",
                "credit card",
                "investment",
                "other",
            ].includes(type)
        ) {
            res.status(400).json({ error: "Invalid account type" });
            return;
        }

        if (
            balance !== undefined &&
            (typeof balance !== "number" || balance < 0)
        ) {
            res.status(400).json({
                error: "Balance must be a non-negative number",
            });
            return;
        }

        try {
            const account = await Account.findOne({
                where: {
                    id: accountId,
                    userId: req.user!.id,
                    isActive: true,
                },
            });

            if (!account) {
                res.status(404).json({ error: "Account not found" });
                return;
            }

            await account.update({
                name,
                type,
                ...(balance !== undefined && { balance }),
                description,
            });

            res.json({ success: true, data: account });
        } catch (error) {
            console.error("Error updating account:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Delete account (soft delete)
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const accountId = parseInt(req.params.id, 10);

    if (isNaN(accountId)) {
        res.status(400).json({ error: "Invalid account ID" });
        return;
    }

    try {
        const account = await Account.findOne({
            where: {
                id: accountId,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!account) {
            res.status(404).json({ error: "Account not found" });
            return;
        }

        await account.update({ isActive: false });
        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export const accountsRouter = router;
