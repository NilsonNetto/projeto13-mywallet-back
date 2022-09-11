import express from "express";
import cors from "cors";
import mongo from "./db/db.js";
import authRouter from './routers/auth.routers.js';
import transactionsRouter from './routers/transactions.routers.js';

const server = express();
const port = 5000;

server.use(express.json());
server.use(cors());

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

setInterval(removeInactiveSessions, 1810000);

server.listen(port, () => {
  console.log(`Listen on por ${port}`);
});