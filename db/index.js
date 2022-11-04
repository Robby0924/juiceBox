//Set up postgres first with initial database
//psql, createdb databaseName
//PG is node's postgresql adapter
const { Client } = require("pg");

//connects new client to juicebox-dev database
const client = new Client({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/juicebox-dev",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

//setting up function for creating new users
async function createUser({ username, password, name, location }) {
  try {
    const {
      //client.query fires first and takes all the values passed into createUser( ).
      //Those values are passed into client.query's 2nd parameter
      //client.query automatically equates the 2nd parameter to values in the 1st parameter
      rows: [user],
    } = await client.query(
      //postgres input
      `
		INSERT INTO users(username, password, name, location) 
		VALUES($1, $2, $3, $4)
		ON CONFLICT (username) DO NOTHING 
		RETURNING *;
	  `,
      //this array should match number of values above
      [username, password, name, location]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

//same as createUser
async function createPost({ authorId, title, content, tags = [] }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
	  INSERT INTO posts("authorId", title, content) 
	  VALUES($1, $2, $3) 
	  RETURNING *;
	`,
      [authorId, title, content]
    );

    const tagList = await createTags(tags);

    //returns the post with the specific tags attached to it
    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}

//setting up a function for creating tags
async function createTags(tagList) {
  //if the array of tags is empty, exit out of the function
  if (tagList.length === 0) {
    return;
  }

  //maps out the list of tags and joins them to include the dollar sign. This is required when inserted by client.query into the table.
  //In order not to replace the existing index in the table, it's shifted over by 1.
  //Value syntax need to be ( x ), ( y ) so the join method has to be specific
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");

  //maps out the list of tags and joins them to include the dollar sign.
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");

  try {
    //Insert new tag(s) into name column in tags table
    //If the tag is already in the name column, do nothing
    await client.query(
      `
      INSERT INTO tags(name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING;`,
      tagList
    );

    const { rows } = await client.query(
      //Selects all columns from tags table
      //If the tag exists in the name column, return true.
      //HELP
      `
      SELECT * FROM tags
      WHERE name
      IN (${selectValues});`,
      tagList
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

//Setting up a function for getting posts by their id
async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await client.query(
      //Select all columns from posts table
      //
      `
    SELECT *
    FROM posts
    WHERE id=$1;
    `,
      [postId]
    );
    //If the post doesn't exist, throw error.
    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Could not find a post with that postId",
      };
    }

    const { rows: tags } = await client.query(
      //Selects all tags from the tags table.
      //Joins post_tags table with tags.id in tags table
      `
    SELECT tags.*
    FROM tags 
    JOIN post_tags ON tags.id=post_tags."tagId"
    WHERE post_tags."postId"=$1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
    SELECT id, username, name, location
    FROM users
    WHERE id=$1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

//Setting up a function for creating a post_tags
//Requires a specific post Id and tag Id
async function createPostTag(postId, tagId) {
  try {
    await client.query(
      //Insert parameters into post_tags table
      //If the post already includes that specific tag, do nothing.
      `
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
}

//Setting up a function for adding tags to posts
async function addTagsToPost(postId, tagList) {
  try {
    //Maps out the tags that are included with the submitted post
    //For each tag, fire createPostTag()
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    //Because this is an async function inside an async function, all awaits have to be loaded up before doing the return
    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

//Setting up a function for getting all posts
async function getAllPosts() {
  try {
    //Selects id column from posts table
    const { rows: postIds } = await client.query(`
	SELECT id
  FROM posts;
  `);

    const posts = await Promise.all(
      //Maps out postIds. For each post, fire getPostById()
      postIds.map((post) => getPostById(post.id))
    );
    return posts;
  } catch (error) {
    throw error;
  }
}

//Setting up a function for getting all tags
async function getAllTags() {
  try {
    const { rows } = await client.query(
      //Selects id and name column from tags table
      `SELECT id, name
   FROM tags;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  try {
    const { rows } = await client.query(
      `SELECT id, username, name, location, active
		FROM users;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
		SELECT id
    FROM posts
		WHERE "authorId"=${userId};
    `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
    return posts;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
		SELECT id, username, name, location, active
		FROM users
		WHERE id=${userId}`);

    // if (!user) {
    //   throw {
    //     name: "UserNotFoundError",
    //     message: "Could not find a user with that userId",
    //   };
    // }

    if (!user) {
      return null;
    }

    user.post = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
}

async function updatePost(postId, fields = {}) {
  const { tags } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  try {
    if (setString.length > 0) {
      await client.query(
        `
      UPDATE posts
      SET ${setString}
      WHERE id=${postId}
      RETURNING *;
      `,
        Object.values(fields)
      );
    }
    if (tags === undefined) {
      return await getPostById(postId);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

    await client.query(
      `
    DELETE FROM post_tags
    WHERE "tagId"
    NOT IN (${tagListIdString})
    AND "postId"=$1;
    `,
      [postId]
    );

    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}
async function getPostsByTagName(tagName) {
  try {
    const { rows: postIds } = await client.query(
      `
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `,
      [tagName]
    );

    return await Promise.all(postIds.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
}
async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [user],
    } = await client.query(
      `
	  UPDATE users
	  SET ${setString}
	  WHERE id=${id}
	  RETURNING *;
	  `,
      Object.values(fields)
    );
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    SELECT *
    FROM users
    WHERE username=$1
    `,
      [username]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  getUserById,
  createPost,
  getAllPosts,
  updatePost,
  getPostsByUser,
  createTags,
  addTagsToPost,
  createPostTag,
  getPostById,
  getPostsByTagName,
  getAllTags,
  getUserByUsername,
};
