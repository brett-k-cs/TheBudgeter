import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db.js'; // Your Sequelize instance

interface TransactionAttributes {
  id: number;

  userId: number;

  type: 'withdrawal' | 'deposit';
  amount: number;
  category: string;
  description?: string;
  date: Date;
  
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null; // Optional for soft deletes
}

type TransactionCreationAttributes = Optional<TransactionAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

interface TransactionInstance
  extends Model<TransactionAttributes, TransactionCreationAttributes>,
    TransactionAttributes {
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    }

export const Transaction = sequelize.define<TransactionInstance>(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('withdrawal', 'deposit'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    modelName: 'Transaction',
    tableName: 'transactions',
    paranoid: true, // Enables soft deletes
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

import { User } from './user.js';

Transaction.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Transaction, { foreignKey: 'userId' });
