import express from "express";
import cors from "cors";
import { Server } from "http";

const server = express();
const port = 5000;

server.use(express.json());
server.use(cors());


server.listen(port, () => {
  console.log(`Listen on por ${port}`);
});