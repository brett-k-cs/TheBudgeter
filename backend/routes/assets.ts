import { Request, Response, Router } from "express";

import { Asset } from "../models/asset.js";
import { AssetHistory } from "../models/assetHistory.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const assets = await Asset.findAll({
      where: {
        userId: req.user!.id,
        deletedAt: null,
      },
    });
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { name, type, valuation, description, ownershipPercentage } = req.body;
  if (!name || !type || valuation === undefined || ownershipPercentage === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const newAsset = await Asset.create({
      userId: req.user!.id,
      name,
      type,
      valuation,
      description,
      ownershipPercentage
    });

    // Create initial asset history entry
    await AssetHistory.create({
      assetId: newAsset.id,
      valuation: parseFloat(valuation.toString()),
      ownershipPercentage: parseFloat(ownershipPercentage.toString()),
    });

    res.status(201).json({ success: true, data: newAsset });
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const assetId = parseInt(req.params.id, 10);
  const { name, type, valuation, description, ownershipPercentage } = req.body;
  if (!name || !type || valuation === undefined || ownershipPercentage === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const asset = await Asset.findOne({
      where: { id: assetId, userId: req.user!.id },
    });
    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    // Track valuation changes
    const previousValuation = parseFloat(asset.valuation.toString());
    const newValuation = parseFloat(valuation.toString());
    const previousOwnershipPercentage = asset.ownershipPercentage;
    const newOwnershipPercentage = ownershipPercentage;

    if (previousValuation !== newValuation || previousOwnershipPercentage !== newOwnershipPercentage) {
      await AssetHistory.create({
        assetId: asset.id,
        valuation: newValuation,
        ownershipPercentage: newOwnershipPercentage,
      });
    }

    asset.name = name;
    asset.type = type;
    asset.valuation = valuation;
    asset.description = description;
    asset.ownershipPercentage = ownershipPercentage;
    await asset.save();
    res.json({ success: true, data: asset });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const assetId = parseInt(req.params.id, 10);
  try {
    const asset = await Asset.findOne({
      where: { id: assetId, userId: req.user!.id },
    });
    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    await asset.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get asset history for a specific asset
router.get("/:id/history", async (req: Request, res: Response) => {
  const assetId = parseInt(req.params.id, 10);

  try {
    // Verify the asset belongs to the user
    const asset = await Asset.findOne({
      where: { id: assetId, userId: req.user!.id },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const history = await AssetHistory.findAll({
      where: {
        assetId: assetId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching asset history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const assetsRouter = router;
