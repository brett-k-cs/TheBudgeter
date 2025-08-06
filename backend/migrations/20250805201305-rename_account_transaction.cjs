'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */

    await queryInterface.renameColumn('transactions', 'accountReference', 'accountId');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */

    await queryInterface.renameColumn('transactions', 'accountId', 'accountReference');
  }
};
