import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

export default async function mongo() {

  let dataBase;

  try {
    dataBase = await mongoClient.db('MyWallet-API');
    return dataBase;
  } catch (error) {
    console.log(error);
    return error;
  }
}
