const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.DB_NAME || 'mydatabase'
    });

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        return reject(err);
      }
      console.log('Connected to MySQL');
      resolve(connection);
    });
  });
};

const createTableIfNotExists = (connection) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS people (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `;

  return new Promise((resolve, reject) => {
    connection.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating table:', err);
        return reject(err);
      }
      console.log('Table "people" is ready');
      resolve(result);
    });
  });
};

const retryConnect = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await connectToDatabase();
      return connection;
    } catch (err) {
      console.log(`Retrying connection to MySQL... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to connect to MySQL after multiple attempts');
};

(async () => {
  try {
    const connection = await retryConnect();
    await createTableIfNotExists(connection);

    app.get('/', (req, res) => {
      const name = `User_${Math.floor(Math.random() * 1000)}`;

      const query = 'INSERT INTO people (name) VALUES (?)';
      connection.query(query, [name], (err, results) => {
        if (err) {
          console.error('Error inserting into database:', err);
          return res.status(500).send('Internal Server Error');
        }

        res.status(201).send("<h1>Full Cycle Rocks!</h1>");
      });
    });

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Could not start the application:', err);
  }
})();
