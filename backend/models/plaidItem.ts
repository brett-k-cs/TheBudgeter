import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db.js";

interface PlaidItemAttributes {
    id: number;
    userId: number;

    accessToken: string;
    itemId: string;
    institutionId?: string;
    institutionName?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

type PlaidItemCreationAttributes = Optional<
    PlaidItemAttributes,
    "id" | "institutionId" | "institutionName" | "createdAt" | "updatedAt"
>;

interface PlaidItemInstance
    extends Model<PlaidItemAttributes, PlaidItemCreationAttributes>,
        PlaidItemAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

export const PlaidItem = sequelize.define<PlaidItemInstance>(
    "PlaidItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        accessToken: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        itemId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        institutionId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        institutionName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        modelName: "PlaidItem",
        tableName: "plaid_items",
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);
