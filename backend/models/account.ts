import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

interface AccountAttributes {
    id: number;
    userId: number;
    name: string;
    type: "checking" | "savings" | "credit_card" | "investment" | "other";
    balance: number;
    isActive: boolean;
    description?: string;

    plaidAccountId?: string;      // Optional: link to Plaid account_id
    plaidItemId?: number;         // Optional FK to PlaidItem.id

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

type AccountCreationAttributes = Optional<
    AccountAttributes,
    | "id"
    | "balance"
    | "isActive"
    | "description"
    | "plaidAccountId"
    | "plaidItemId"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
>;

interface AccountInstance
    extends Model<AccountAttributes, AccountCreationAttributes>,
        AccountAttributes {
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export const Account = sequelize.define<AccountInstance>(
    "Account",
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
            type: DataTypes.ENUM(
                "checking",
                "savings",
                "credit_card",
                "investment",
                "other"
            ),
            allowNull: false,
            defaultValue: "checking",
        },
        balance: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        modelName: "Account",
        tableName: "accounts",
        paranoid: true, // Enables soft deletes
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Associations will be set up after all models are imported
import { User } from "./user.js";

Account.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Account, { foreignKey: "userId" });

export type { AccountAttributes, AccountCreationAttributes };
