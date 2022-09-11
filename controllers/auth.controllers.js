import bcrypt from "bcrypt";
import joi from "joi";
import { v4 as uuid } from 'uuid';
import mongo from "../db/db.js";

let db = await mongo();

const loginSchema = joi.object({
  email: joi.string().required().trim(),
  password: joi.string().min(3).required().trim()
});

const registerSchema = joi.object({
  name: joi.string().min(5).required().trim(),
  email: joi.string().required().trim(),
  password: joi.string().min(3).required().trim()
});


const newUser = async (req, res) => {
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
};

const startSession = async (req, res) => {
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

};

const endSession = async (req, res) => {
  const { authorization } = req.headers;

  const token = authorization?.replace('Bearer ', '');

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
      return res.sendStatus(401);
    }

    await db.collection('sessions').deleteOne({ token });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

export { newUser, startSession, endSession };