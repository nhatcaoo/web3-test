
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    txId: {
        type: String,
        required: true,
        unique: true,
    },
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);