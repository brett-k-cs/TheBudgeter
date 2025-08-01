import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db.js';

interface UserAttributes {
  id: number;
  email: string;
  name: string;
  passwordHash: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    }

export const User = sequelize.define<UserInstance>(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    modelName: 'User',
    tableName: 'users',
    paranoid: true, // Enables soft deletes
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);
