const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "e734cefc746a949fe40ac1aa84a72505795beb35faa8926f5589e4bb7338e94c",
    resave: false,
    saveUninitialized: true,
  })
);

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@error_404...",
  database: "reStore",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.get("/is-logged-in", (req, res) => {
  if (req.session.user) {
      res.json({ loggedIn: true });
  } else {
      res.json({ loggedIn: false });
  }
});

  

// **User Registration**
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, password], (err) => {
    if (err) return res.send("Error: User already exists!");
    res.redirect("/login.html");
  });
});

// **User Login**
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.send("Database error");
    if (results.length > 0) {
      req.session.userId = results[0].id;
      res.redirect("/dashboard.html");
    } else {
      res.send("Invalid login credentials");
    }
  });
});


// **Logout**
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// **Store Data (Only for Logged-in Users)**
app.post("/store-data", (req, res) => {
  if (!req.session.userId) return res.send("Please log in first!");
  
  const { url, username, password } = req.body;
  const sql = "INSERT INTO stored_data (user_id, url, username, password) VALUES (?, ?, ?, ?)";
  db.query(sql, [req.session.userId, url, username, password], (err) => {
    if (err) return res.send("Error storing data");
    res.redirect("/dashboard.html");
  });
});

// **Get Stored Data for Logged-in User**
app.get("/get-data", (req, res) => {
  if (!req.session.userId) return res.send("Unauthorized access");

  const sql = "SELECT * FROM stored_data WHERE user_id = ?";
  db.query(sql, [req.session.userId], (err, results) => {
    if (err) return res.send("Error fetching data");
    res.json(results);
  });
});

// **Delete Stored Data**
app.post("/delete-data", (req, res) => {
  if (!req.session.userId) return res.send("Unauthorized access");

  const { id } = req.body;
  const sql = "DELETE FROM stored_data WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.send("Error deleting data");
    res.redirect("/dashboard.html");
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
