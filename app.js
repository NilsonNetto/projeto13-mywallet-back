import express from "express";
import cors from "cors";
import { Server } from "http";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import joi from "joi";
import { v4 as uuid } from 'uuid';
import dotenv from "dotenv";
dotenv.config();

const server = express();
const port = 5000;

server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db('MyWallet-API');
});

const loginSchema = joi.object({
  email: joi.string().required().trim(),
  password: joi.string().min(6).required.trim()
});

const registerSchema = joi.object({
  name: joi.string().min(5).required().trim(),
  email: joi.string().required().trim(),
  password: joi.string().min(6).required.trim()
});

server.post('/', async (req, res) => {
  const loginData = req.body;

  const validation = loginSchema.validate(loginData, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map(detail => detail.message);
    console.log(errors);
    return res.status(422).send(errors);
  }

  try {
    const user = await db.collection('users').findOne({ email: loginData.email });

    const passwordValidation = bcrypt.compareSync(user.password, loginData.password);

    if (user && passwordValidation) {
      const token = uuid();
      await db.colletion('sessions').insertOne({ userID: user._id, token });
      return res.send(token);
    } else {
      return res.status(400).send('Email ou senha incorretos');
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }

});

server.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const validation = registerSchema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map(detail => detail.message);
    console.log(errors);
    return res.status(422).send(errors);
  }

  const passwordHash = bcrypt.hashSync(password, 13);

  try {
    await db.collection('users').insertOne({ name, email, passwordHash });
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }

});


server.listen(port, () => {
  console.log(`Listen on por ${port}`);
});