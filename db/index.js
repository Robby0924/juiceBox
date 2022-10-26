const { Client } = require("pg");

const client = new Client("postgres://localhost:5432/juicebox-dev");
module.exports = {
  client,
};

async function createUser({ username, password, name, location }) {
	try {
	  const {rows} = await client.query(`
		INSERT INTO users(username, password, name, location) 
		VALUES($1, $2) 
		ON CONFLICT (username) DO NOTHING 
		RETURNING *;
	  `, [username, password, name, location]);
  
	  return rows;
	} catch (error) {
	  throw error;
	}
  }

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active
		FROM users;`
		
  );
  return rows;
}


module.exports = {
  client,
  getAllUsers,
  createUser,
};



// async function createUser({username, password}) {
// 	try {
// 		const result = await client.query(`
// 		INSERT INTO users(username, password)
// 		VALUES($1, $2)
// 		ON CONFLICT (username) DO NOTHING
// 		RETURNING *;
// 		`, [username, password]);
// 		return result;
// 	} catch (error) {
// 		throw error;
// 	}
// }
