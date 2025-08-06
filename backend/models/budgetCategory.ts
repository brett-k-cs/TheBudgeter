import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

export interface BudgetCategoryAttributes {
  id: number;
  budgetId: number;
  categoryId: string;
  budgetedAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type BudgetCategoryCreationAttributes = Optional<
  BudgetCategoryAttributes,
  "id" | "createdAt" | "updatedAt"
>;

interface BudgetCategoryInstance
  extends Model<BudgetCategoryAttributes, BudgetCategoryCreationAttributes>,
    BudgetCategoryAttributes {}

export const BudgetCategory = sequelize.define<BudgetCategoryInstance>(
  "BudgetCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    budgetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    budgetedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    modelName: "BudgetCategory",
    tableName: "budget_categories",
    timestamps: true,
  }
);
