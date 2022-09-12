import express from "express";
import * as transactionsConstrollers from '../controllers/transactions.controllers.js';
import tokenValidation from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(tokenValidation);

router.post('/transactions', transactionsConstrollers.newTransaction);

router.get('/transactions', transactionsConstrollers.transactionsHistory);

export default router;
