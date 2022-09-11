import express from "express";
import * as authController from '../controllers/auth.controllers.js';

const router = express.Router();

router.post('/register', authController.newUser);

router.post('/login', authController.startSession);

router.delete('/logout', authController.endSession);

export default router;