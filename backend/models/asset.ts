import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

interface AssetAttributes {
  id: number;
  userId: number;
  name: string;
  type: "property" | "automobile" | "collectibles" | "other";
  valuation: number;
  ownershipPercentage: number;
  description?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type AssetCreationAttributes = Optional<
  AssetAttributes,
  "id" | "description" | "createdAt" | "updatedAt" | "deletedAt"
>;

interface AssetInstance
  extends Model<AssetAttributes, AssetCreationAttributes>,
    AssetAttributes {
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const Asset = sequelize.define<AssetInstance>(
  "Asset",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("property", "automobile", "collectibles", "other"),
      allowNull: false,
      defaultValue: "other",
    },
    valuation: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ownershipPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100, // Default to 100% ownership
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    modelName: "Assets",
    tableName: "assets",
    paranoid: true, // Enables soft deletes
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Associations will be set up after all models are imported
import { User } from "./user.js";

Asset.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Asset, { foreignKey: "userId" });

export type { AssetAttributes, AssetCreationAttributes };
