

require("dotenv").config();
//runs express
const express = require("express");
//main router where all other routes branch from
const apiRouter = express.Router();
//supplies randomized token for Ids
const jwt = require("jsonwebtoken");
//Brings users by Id from database
const { getUserById } = require("../db");
//Brings in secret code from .env file. Required w/ token to check authentication 
const { JWT_SECRET } = process.env;


//Authenticates user id so it can be used in other routes. This is typically needed in the api/index.js folder so that it only needs authentication once. 
//Sets up header for all components that require authentication. Note that not all functions like looking up tags and registering do not require it.
apiRouter.use(async (req, res, next) => {

  //prefix and auth are header setup
  const prefix = "Bearer ";
  const auth = req.header("Authorization");

  //if there is no auth, move on to the error handler found at the bottom of this file
  if (!auth) {
    next();

    // else if the auth starts with prefix, set variable token equal to a randomized 
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);

    try {
      const { id } = jwt.verify(token, JWT_SECRET);

      if (id) {
        req.user = await getUserById(id);
        next();
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  } else {
    next({
      name: "AuthorizationHeaderError",
      message: `Authorization token must start with ${prefix}`,
    });
  }
});


apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user);
  }

  next();
});


//imports tags router, sets route to /api/tags
const tagsRouter = require("./tags");
apiRouter.use("/tags", tagsRouter);

//imports users router, sets route to /api/users
const usersRouter = require("./users");
apiRouter.use("/users", usersRouter);


//imports posts router, sets route to /api/posts
const postsRouter = require("./posts");
apiRouter.use("/posts", postsRouter);

apiRouter.use((error, req, res, next) => {
  res.send({
    name: error.name,
    message: error.message,
  });
});

module.exports = apiRouter;
