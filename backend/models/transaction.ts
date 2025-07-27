import { DataTypes, Model, Optional, Op } from 'sequelize';
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
import { BudgetTransactionExclusion } from './budgetTransactionExclusion.js';

Transaction.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Transaction, { foreignKey: 'userId' });

Transaction.hasMany(BudgetTransactionExclusion, { foreignKey: 'transactionId', as: 'exclusions', onDelete: 'CASCADE' });
BudgetTransactionExclusion.belongsTo(Transaction, { foreignKey: 'transactionId' });

// Fix transaction table using labels instead of ids for categories
const categories = [
  { "id": "gas", "label": "Gas" },
  { "id": "groceries", "label": "Groceries" },
  { "id": "dining", "label": "Dining & Restaurants" },
  { "id": "entertainment", "label": "Entertainment" },
  { "id": "shopping", "label": "Shopping" },
  { "id": "travel", "label": "Travel" },
  { "id": "transportation", "label": "Transportation" },
  { "id": "utilities", "label": "Utilities" },
  { "id": "health_fitness", "label": "Health & Fitness" },
  { "id": "education", "label": "Education" },
  { "id": "personal_care", "label": "Personal Care" },
  { "id": "home_garden", "label": "Home & Garden" },
  { "id": "automotive", "label": "Automotive" },
  { "id": "insurance", "label": "Insurance" },
  { "id": "charity_donations", "label": "Charity & Donations" },
  { "id": "miscellaneous", "label": "Miscellaneous" },
  { "id": "income", "label": "Income" }
]

Transaction.findAll({
  attributes: ['id', 'category'],
  where: {
    category: {
      [Op.notIn]: Object.values(categories).map(category => category.id)
    }
  }
}).then(transactions => {
  // Process the transactions as needed
  console.log('Transactions not in predefined categories:', transactions.map(a => a.toJSON()));
  transactions.forEach(transaction => {
    const category = categories.find(cat => cat.label === transaction.category);
    if (category) {
      transaction.category = category.id; // Update to use label instead of id
      transaction.save(); // Save the updated transaction
    }
  });
  console.log('Updated transactions with labels:', transactions.map(a => a.toJSON()));
}).catch(error => {
  console.error('Error fetching transactions:', error);
});
