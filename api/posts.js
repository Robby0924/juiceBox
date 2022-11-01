const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost, getPostById, updatePost} = require('../db');
const { requireUser } = require('./utils'); 


postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  console.log("req dot body", req.body)
  const {title, content, tags =""} = req.body;

  const tagArr = tags.trim().split(/\s+/)
  const postData = {};

  if (tagArr.length){
    postData.tags=tagArr;
  }

  try {

    postData.authorId = req.user.id,
    postData.title = title 
    postData.content = content
       const post = await createPost(postData);

    if (post){
      res.send ({post})
    };
    
  } catch ({ name, message }){
    next({name, message})
  }
});











// postsRouter.post('/', requireUser, async (req, res, next) => {
//   res.send({ message: 'under construction'});
// });

postsRouter.use((req, res, next) => {
 console.log("A request is being made to /posts");
 next();
});

postsRouter.get('/', async (req, res) => {
  const posts = await getAllPosts();
  
  res.send({
    posts
  });
});

module.exports = postsRouter;





