import express from "express";
import * as transactionsConstrollers from '../controllers/transactions.controllers.js';

const router = express.Router();

router.post('/transactions', transactionsConstrollers.newTransaction);

router.get('/transactions', transactionsConstrollers.transactionsHistory);

export default router;
