import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

export interface BudgetTransactionExclusionAttributes {
  id: number;
  budgetId: number;
  transactionId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type BudgetTransactionExclusionCreationAttributes = Optional<
  BudgetTransactionExclusionAttributes,
  "id" | "createdAt" | "updatedAt"
>;

interface BudgetTransactionExclusionInstance
  extends Model<
      BudgetTransactionExclusionAttributes,
      BudgetTransactionExclusionCreationAttributes
    >,
    BudgetTransactionExclusionAttributes {}

export const BudgetTransactionExclusion = sequelize.define<BudgetTransactionExclusionInstance>(
  "BudgetTransactionExclusion",
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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
},
{
    modelName: "BudgetTransactionExclusion",
    tableName: "budget_transaction_exclusions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["budgetId", "transactionId"],
      },
    ],
  }
);

// Associations will be set up in the main models after all models are defined
