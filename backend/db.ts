import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'sequelize.sqlite',
  // logging: false
});

export const initializeDatabase = async () => {
  try {
    await sequelize.sync();

    sequelize.authenticate();
  } catch (error) {
    console.error('Error initializing the database:', error);
    // process.exit(1);
  }
  console.log('Connection to the database has been established successfully.');
}