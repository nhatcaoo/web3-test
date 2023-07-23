const express = require('express');
const { createNewTransaction, getAllTransactions, getTransactionsOfSender, getSingleTransactionDetails } = require('../controllers/TransactionController');
const { isAuthenticatedUser } = require('../middlewares/user_actions/auth');

const router = express.Router();

router.route('/transaction/new').post(createNewTransaction);
router.route('/transactions').get(getAllTransactions);
router.route('/transactions/sender/:sender').get(getTransactionsOfSender);
router.route('/transaction/:id').get(getSingleTransactionDetails);

module.exports = router;