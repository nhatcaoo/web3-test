const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const Transaction = require('../models/Transaction'); // Assuming you have the Transaction model defined
const ErrorHandler = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid'); // Import the uuid package
// Create and Store a New Transaction
exports.createNewTransaction = asyncErrorHandler(async (req, res, next) => {
    const {
        sender,
        receiver,
        token,
        transactionHash,
        amount,
    } = req.body;

    const txId = uuidv4(); // This will create a unique UUID

    // Create a new transaction document
    const newTransaction = new Transaction({
        txId,
        sender,
        receiver,
        token,
        transactionHash,
        amount,
    });

    // Save the transaction to the database
    await newTransaction.save();

    res.status(201).json({
        success: true,
        transaction: newTransaction,
    });
});
// Get All Transactions
exports.getAllTransactions = asyncErrorHandler(async (req, res, next) => {
    console.log("nothing")
    const transactions = await Transaction.find();

    if (!transactions) {
        return next(new ErrorHandler("Transactions Not Found", 404));
    }

    res.status(200).json({
        success: true,
        transactions,
    });
});

// Get Transactions of a Sender
exports.getTransactionsOfSender = asyncErrorHandler(async (req, res, next) => {
    const { sender } = req.params;
    const transactions = await Transaction.find({ sender });

    if (!transactions) {
        return next(new ErrorHandler("Transactions Not Found", 404));
    }

    res.status(200).json({
        success: true,
        transactions,
    });
});

// Get Single Transaction Details
exports.getSingleTransactionDetails = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
        return next(new ErrorHandler("Transaction Not Found", 404));
    }

    res.status(200).json({
        success: true,
        transaction,
    });
});

// Other transaction-related functions can be added here, like creating new transactions, updating transactions, deleting transactions, etc.
