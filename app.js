import express from "express";
import cors from "cors";
import mongo from "./db/db.js";
import dotenv from "dotenv";
dotenv.config();
import authRouter from './routers/auth.routers.js';
import transactionsRouter from './routers/transactions.routers.js';

const server = express();
const port = process.env.PORT;

server.use(cors());
server.use(express.json());

let db = await mongo();

server.use(authRouter);

server.use(transactionsRouter);

async function removeInactiveSessions() {

  try {
    const allSessions = await db.collection('sessions').find().toArray();

    if (allSessions.length === 0) {
      return;
    }

    console.log('Removendo participantes');
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
removeInactiveSessions();
setInterval(removeInactiveSessions, 1810000);

server.listen(port, () => {
  console.log(`Listen on por ${port}`);
});
