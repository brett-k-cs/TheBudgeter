import type { BudgetCategoryAttributes } from './budgetCategory.js';

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db.js';

interface BudgetAttributes {
  id: number;
  userId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  primary: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  budgetCategories?: BudgetCategoryAttributes[];
}

type BudgetCreationAttributes = Optional<BudgetAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

interface BudgetInstance extends Model<BudgetAttributes, BudgetCreationAttributes>, BudgetAttributes {}

export const Budget = sequelize.define<BudgetInstance>(
  'Budget',
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    modelName: 'Budget',
    tableName: 'budgets',
    paranoid: true,
    timestamps: true,
  }
);

// Associations
import { User } from './user.js';
import { BudgetCategory } from './budgetCategory.js';
import { BudgetTransactionExclusion } from './budgetTransactionExclusion.js';

Budget.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Budget, { foreignKey: 'userId' });

Budget.hasMany(BudgetCategory, { foreignKey: 'budgetId', as: 'budgetCategories', onDelete: 'CASCADE' });
BudgetCategory.belongsTo(Budget, { foreignKey: 'budgetId' });

Budget.hasMany(BudgetTransactionExclusion, { foreignKey: 'budgetId', as: 'exclusions', onDelete: 'CASCADE' });
BudgetTransactionExclusion.belongsTo(Budget, { foreignKey: 'budgetId' });
