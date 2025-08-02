module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './sequelize.sqlite'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    dialect: 'sqlite',
    storage: './sequelize.sqlite'
  }
};
