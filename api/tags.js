const express = require("express");
const tagsRouter = express.Router();
const { getPostsByTagName } = require("../db");

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");
  next();
});

tagsRouter.get("/:tagName/posts", async (req, res, next) => {
  const { tagName } = req.params;

  try {
    const posts = await getPostsByTagName(tagName);

    const filteredPosts = posts.filter((post) => {
      return post.active || (req.user && post.author.id === req.user.id);
    });

    if (filteredPosts) {
      res.send({ filteredPosts });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = tagsRouter;
