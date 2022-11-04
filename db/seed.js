//Finished making personal notes.

//imports these functions from /db/index.js
const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  getUserById,
  createPost,
  getAllPosts,
  updatePost,
  createTags,
  addTagsToPost,
  getPostsByTagName,
} = require("./index");

//Function for calling a query making sure duplicate tables don't exist.
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    //If tableName exists, drop the table
    await client.query(`
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS posts;
		DROP TABLE IF EXISTS users;
		`);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error;
  }
}

//Function for calling a query which creates all necessary tables
async function createTables() {
  try {
    console.log("Starting to build tables...");
    await client.query(`
		  CREATE TABLE users (
			id SERIAL PRIMARY KEY,
			username varchar(255) UNIQUE NOT NULL,
			password varchar(255) NOT NULL,
			name VARCHAR(255) NOT NULL,
			location VARCHAR(255) NOT NULL,
			active BOOLEAN DEFAULT true );
		  
      CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      "authorId" INTEGER REFERENCES users(id) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      active BOOLEAN DEFAULT true
      );

      CREATE TABLE tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE post_tags (
      "postId" INTEGER REFERENCES posts(id) NOT NULL,
      "tagId" INTEGER REFERENCES tags(id) NOT NULL,
      UNIQUE ("postId", "tagId")
      );

		  `);

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
}

//Function for creating hardcoded initial users so that we can use them for testing purposes.
async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    await createUser({
      username: "albert",
      password: "bertie99",
      name: "Al Bert",
      location: "Sidney, Australia",
      post: [],
    });
    await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "Just Sandra",
      location: "Ain't tellin'",
      post: [],
    });
    await createUser({
      username: "glamgal",
      password: "soglam",
      name: "Joshua",
      location: "Upper East Side",
      post: [],
    });

    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!");
    throw error;
  }
}

//Function for creating hardcoded initial posts so we can use them for testing purposes.
async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    console.log("Starting to create posts...");

    await createPost({
      authorId: albert.id,
      title: "albert Post",
      content: "This is my first post.",
      tags: ["#happy", "#youcandoanything"],
    });
    await createPost({
      authorId: sandra.id,
      title: "sandra Post",
      content: "This is my first post.",
      tags: ["#happy", "#worst-day-ever"],
    });

    await createPost({
      authorId: glamgal.id,
      title: "glamgal Post",
      content: "This is my first post.",
      tags: ["#happy", "#youcandoanthing", "#catmandoeverything"],
    });
    console.log("Finished creating posts!");
  } catch (error) {
    console.log("Error creating posts!");
    throw error;
  }
}

//Function for creating hardcoded initial tags so we can use them for testing purposes.
async function createInitialTags() {
  try {
    console.log("Starting to create tags...");

    const [happy, sad, inspo, catman] = await createTags([
      "#happy",
      "#worst-day-ever",
      "#youcandoanything",
      "#catmandoeverything",
    ]);
    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);

    console.log("Finished creating tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    await createInitialTags();
  } catch (error) {
    console.log("Error during rebuildDB");
    throw error;
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    //Tests the function for getting all users.
    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result:", users);

    //Tests the function for updating user info from a specific user.
    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    //Tests the function for getting all posts.
    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    //Tests the function for updating posts
    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result:", updatePostResult);

    //Tests the function for getting a user by its user id.
    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Results:", albert);

    //Tests the function for updating posts, specifically for changing tags.
    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"],
    });
    console.log("Result:", updatePostTagsResult);

    //Tests the function for getting specific posts by tag name. One tag name can have multiple posts.
    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy[0].tags);

    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    throw error;
  }
}

//This is one long line that first starts making the database then tests the database. If it catches an error, it logs the error. Finally it ends the client.
//The catch and finally are important because normally the terminal will throw a bunch of red errors at you if a single line is wrong.
//Doing catch and finally prevents this from happening and proceeds with reading each line. If a specific test has an error, it doesn't prevent the other tests from executing.
rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
