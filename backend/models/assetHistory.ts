import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

interface AssetHistoryAttributes {
  id: number;
  assetId: number;
  valuation: number;
  ownershipPercentage?: number; // Optional field for shared assets

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

type AssetHistoryCreationAttributes = Optional<
  AssetHistoryAttributes,
  "id" | "createdAt" | "updatedAt"
>;

interface AssetHistoryInstance
  extends Model<AssetHistoryAttributes, AssetHistoryCreationAttributes>,
    AssetHistoryAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

export const AssetHistory = sequelize.define<AssetHistoryInstance>(
  "AssetHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valuation: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ownershipPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    modelName: "AssetHistory",
    tableName: "asset_history",
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Associations will be set up after all models are imported
import { Asset } from "./asset.js";

AssetHistory.belongsTo(Asset, { foreignKey: "assetId", onDelete: "CASCADE" });
Asset.hasMany(AssetHistory, { foreignKey: "assetId", as: "history" });

export type { AssetHistoryAttributes, AssetHistoryCreationAttributes };
