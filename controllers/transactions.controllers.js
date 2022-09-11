import joi from "joi";
import dayjs from "dayjs";
import mongo from "../db/db.js";

let db = await mongo();

const transactionSchema = joi.object({
  description: joi.string().min(3).required().trim(),
  price: joi.string().required(),
  type: joi.string().valid('Income', 'Outcome').required()
});

const transactionsHistory = async (req, res) => {
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

    const history = await db.collection('transactions').find({ userId: session.userId }).toArray();
    res.send(history);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

const newTransaction = async (req, res) => {
  const { authorization } = req.headers;
  const { description, price, type } = req.body;

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
      type,
      date: dayjs().format('DD/MM')
    };

    await db.collection('transactions').insertOne(transaction);
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

export { transactionsHistory, newTransaction };