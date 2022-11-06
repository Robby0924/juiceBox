const {PORT = 3000} = process.env;
//express setup
const express = require("express");
const server = express();
const cors = require("cors");
const apiRouter = require("./api");

//cors allows you to access your API from React

server.use(cors());



const morgan = require("morgan");
server.use(morgan("dev"));

server.use(express.json());

server.use("/api", apiRouter);

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");
  
  next();
});

const { client } = require("./db");
client.connect();

server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});

