'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */

    await queryInterface.addColumn('transactions', 'accountReference', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */

    await queryInterface.removeColumn('transactions', 'accountReference');
  }
};
