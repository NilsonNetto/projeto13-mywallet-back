import express from "express";
import * as authController from '../controllers/auth.controllers.js';
import tokenValidation from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/register', authController.newUser);

router.post('/login', authController.startSession);

router.delete('/logout', tokenValidation, authController.endSession);

export default router;