const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

const dbPath = path.join(__dirname, "users_data.db"); // Use an absolute path for the database file
const db = connectToDB(dbPath);   // Connect to the database (creates the file if it doesn't exist)

const frontendPath = path.join(__dirname, "../Frontend");

// Middleware setup
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(frontendPath)));

// Serve the HTML file
app.get("/", (req, res) => {
  fs.readFile(path.join(frontendPath, "index.html"), "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Error loading the page");
      return;
    }
    res.send(data);
  });
});

// Handle user login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`Username: ${username}, Password: ${password}`);

  try {
    const time_left = await checkUserExistence(username, password);
    await insertUserToDB(username, password, time_left);

    res.set("Content-Type", "text/plain");
    res.send(String(time_left));
  } catch (err) {
    res.status(500).send("Error processing request");
  }
});

// Update user time
app.post("/update_time", (req, res) => {
  const { username, password, time_left } = req.body;

  // Update the time_left in the database
  const updateSql =
    "UPDATE users_data SET time_left = ? WHERE username = ? AND password = ?";
 
    db.run(updateSql, [time_left, username, password], function (err) {
    if (err) 
    {
      console.error("\nError updating data:", err.message);
      res.status(500).send("\nError updating time");
      return;
    }

    res.set("Content-Type", "text/plain");
    res.send("Time updated successfully");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`\nServer running at http://localhost:${port}/`);
});

//------------------------------------------- Functions Implementation -------------------------------------------

function connectToDB(dbPath) {
  const db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) 
      {
        console.error("Error opening database:", err.message);
        process.exit(1); // Exit the process if the database can't be opened
      } 
      else 
      {
        // Create table if it doesn't exist
        const createTableSql =
          "CREATE TABLE IF NOT EXISTS users_data(id INTEGER PRIMARY KEY, username TEXT, password TEXT, time_left INTEGER)";
        
          db.run(createTableSql, (err) => {
          if (err) 
          {
            console.error("\nError creating table:", err.message);
          } 
          else 
          {
            console.log("\nTable created or already exists.\n");
          }
        });
      }
    }
  );

  return db;
}

function checkUserExistence(username, password) {
  return new Promise((resolve, reject) => {
    const query =
      "SELECT time_left FROM users_data WHERE username = ? AND password = ?";
    db.get(query, [username, password], (err, row) => {
      if (err) 
        {
            console.error("Error retrieving data:", err.message);
            reject("Error retrieving data");
            return;
        }

        let time_left;
        if (row) 
        {
            time_left = row.time_left;
        } 
        else
        {
            console.log("\nA new username added\n");
            time_left = 60; // Set 60 sec for a new user
        }

        resolve(time_left);
    });
  });
}

async function insertUserToDB(username, password, time_left) {
  await new Promise((resolve, reject) => {
        if (time_left === 60) {
            // Add new user into our DB
            const insertSql = "INSERT INTO users_data (username, password, time_left) VALUES (?, ?, ?)";

            db.run(insertSql, [username, password, time_left], (err) => {
                if (err) {
                    console.error("Error inserting data:", err.message);
                    reject(err);
                    return;
                }
                resolve();
            });
        } else {
            resolve(); // No need to insert if the user already exists
        }
    });
    
    // Query the data after insertion
    const selectSql = "SELECT * FROM users_data";
    return await new Promise((resolve_1, reject_1) => {
        db.all(selectSql, [], (err_1, rows) => {
            if (err_1) {
                console.error("Error querying data:", err_1.message);
                reject_1(err_1);
                return;
            }

            rows.forEach((row) => {
                console.log(row);
            });
            console.log("\n");

            resolve_1();
        });
    });
}
