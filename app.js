import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import joi from "joi";
import { v4 as uuid } from 'uuid';
import dotenv from "dotenv";
import dayjs from "dayjs";
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
  password: joi.string().min(3).required().trim()
});

const registerSchema = joi.object({
  name: joi.string().min(5).required().trim(),
  email: joi.string().required().trim(),
  password: joi.string().min(3).required().trim()
});

const transactionSchema = joi.object({
  description: joi.string().min(3).required().trim(),
  price: joi.number().required()
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

server.post('/login', async (req, res) => {
  const loginData = req.body;

  const validation = loginSchema.validate(loginData, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map(detail => detail.message);
    console.log(errors);
    return res.status(422).send(errors);
  }

  try {
    const user = await db.collection('users').findOne({ email: loginData.email });

    const passwordValidation = bcrypt.compareSync(loginData.password, user.passwordHash);

    if (user && passwordValidation) {
      const token = uuid();
      await db.collection('sessions').insertOne({ userId: user._id, token });
      delete user.passwordHash;
      return res.send({ ...user, token, loginTime: Date.now() });
    } else {
      return res.status(400).send('Email ou senha incorretos');
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }

});

server.post('/transactions', async (req, res) => {
  const { authorization } = req.headers;
  const { description, price } = req.body;

  const token = authorization?.replace('Bearer ', '');

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
      return res.sendStatus(401);
    }

    const validation = transactionSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map(detail => detail.message);
      console.log(errors);
      return res.status(422).send(errors);
    }

    const transaction = {
      userId: session.userId,
      description,
      price,
      date: dayjs().format('DD/MM')
    };

    await db.collection('transactions').insertOne(transaction);
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.get('/transactions', async (req, res) => {
  const { authorization } = req.headers;

  const token = authorization?.replace('Bearer ', '');

  console.log(token);
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
      return res.sendStatus(401);
    }

    const history = await db.collection('transactions').find({ userId: session.userId }).toArray();
    res.send(history);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.delete('/logout', async (req, res) => {
  const { authorization } = req.headers;

  const token = authorization?.replace('Bearer ', '');

  console.log(token);
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
      return res.sendStatus(401);
    }

    await db.collection('sessions').remove({ token });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

async function removeInactiveSessions() {

  try {
    const allSessions = await db.collection('sessions').find().toArray();

    if (allSessions.length === 0) {
      return;
    }

    console.log('Removendo participantes: ', dayjs().format('HH:mm:ss'));
    allSessions.forEach(async session => {
      const lastUpdate = Date.now() - session.loginTime;

      if (lastUpdate >= 1800000) {
        await db.collection('sessions').deleteOne({ _id: ObjectId(session._id) });
      }
    });
  } catch (error) {
    console.log(error);
  }
}

setInterval(removeInactiveSessions, 1800000);

server.listen(port, () => {
  console.log(`Listen on por ${port}`);
});