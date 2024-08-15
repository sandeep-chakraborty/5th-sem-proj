const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from "public" directory

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"), (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT
  )`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Table "users" is ready.');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_name TEXT UNIQUE,
    password TEXT,
    department TEXT
  )`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Table "hospitals" is ready.');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_name TEXT,
    department_name TEXT
  )`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Table "departments" is ready.');
    }
  });
});

// Serve HTML Pages
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// User Signup Route
app.post("/user/signup", (req, res) => {
  const { email, name, password } = req.body;

  // Check if all fields are provided
  if (!email || !name || !password) {
    return res
      .status(400)
      .json({ error: "Email, name, and password are required." });
  }

  // Insert the new user into the database
  db.run(
    `INSERT INTO users (email, name, password) VALUES (?, ?, ?)`,
    [email, name, password],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "User already exists." });
      }
      res
        .status(201)
        .json({ message: "User created successfully", userId: this.lastID });
    }
  );
});

// User Login Route
app.post("/user/log", (req, res) => {
  const { email, password } = req.body;
  d
  // Check if all fields are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Retrieve user from the database
  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    res
      .status(200)
      .json({ message: "Login successful", userId: user.id, name: user.name });
  });
});
//admin login
app.post("/admin/log", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (username === "admin" && password === "admin1") {
    return res.status(200).json({ message: "Admin login successful", redirectTo: "/hospital_data" });
  } else {
    return res.status(400).json({ error: "Invalid admin credentials" });
  }
});
app.get("/hospital_data", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "hospital_data.html"));
});



// Hospital Signup Route
app.post("/hospital/signup", (req, res) => {
  const { hospital_name, password } = req.body;

  // Check if all fields are provided
  if (!hospital_name || !password) {
    return res
      .status(400)
      .json({ error: "Hospital name and password are required." });
  }

  // Insert the new hospital into the database
  db.run(
    `INSERT INTO hospitals (hospital_name, password) VALUES (?, ?)`,
    [hospital_name, password],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Hospital already exists." });
      }
      res
        .status(201)
        .json({
          message: "Hospital created successfully",
          hospitalId: this.lastID,
        });
    }
  );
});

app.get('/hospital/data', (req, res) => {
    db.all('SELECT hospital_name, password FROM hospitals', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve hospital data.' });
        }
        res.status(200).json(rows);
    });
});


// Hospital Login Route
app.post("/hospital/login", (req, res) => {
  const { hospital_name, password } = req.body;

  // Check if all fields are provided
  if (!hospital_name || !password) {
    return res
      .status(400)
      .json({ error: "Hospital name and password are required." });
  }

  // Retrieve hospital from the database
  db.get(
    `SELECT * FROM hospitals WHERE hospital_name = ? AND password = ?`,
    [hospital_name, password],
    (err, hospital) => {
      if (err || !hospital) {
        return res.status(400).json({ error: "Invalid hospital name or password." });
      }

      res.status(200).json({
        message: "Hospital login successful",
        redirectTo: `/manage-departments?hospital_name=${encodeURIComponent(hospital_name)}`,
      });
    }
  );
});
// Serve Hospital Login Page
app.get("/hospital/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "hospital-login.html"));
});


// Update Department Route
app.put("/hospital/department", (req, res) => {
  const { hospitalId, department } = req.body;

  // Check if all fields are provided
  if (!hospitalId || !department) {
    return res
      .status(400)
      .json({ error: "Hospital ID and department are required." });
  }

  // Update the department for the hospital
  db.run(
    `UPDATE hospitals SET department = ? WHERE id = ?`,
    [department, hospitalId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Could not update department." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Hospital not found." });
      }
      res.status(200).json({ message: "Department updated successfully" });
    }
  );
});

// New endpoint to delete a hospital
app.delete("/hospital/:id", (req, res) => {
  const hospitalId = req.params.id;

  db.run(`DELETE FROM hospitals WHERE id = ?`, [hospitalId], function (err) {
    if (err) {
      return res.status(400).json({ error: "Could not delete hospital." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Hospital not found." });
    }
    res.status(200).json({ message: "Hospital deleted successfully" });
  });
});

// New endpoint to edit a hospital
app.put("/hospital/:id", (req, res) => {
  const hospitalId = req.params.id;
  const { hospital_name, password, department } = req.body;

  if (!hospital_name && !password && !department) {
    return res.status(400).json({ error: "At least one field to update is required." });
  }

  let updateQuery = `UPDATE hospitals SET `;
  const updateValues = [];

  if (hospital_name) {
    updateQuery += `hospital_name = ?, `;
    updateValues.push(hospital_name);
  }
  if (password) {
    updateQuery += `password = ?, `;
    updateValues.push(password);
  }
  if (department) {
    updateQuery += `department = ?, `;
    updateValues.push(department);
  }

  updateQuery = updateQuery.slice(0, -2); // Remove the last comma and space
  updateQuery += ` WHERE id = ?`;
  updateValues.push(hospitalId);

  db.run(updateQuery, updateValues, function (err) {
    if (err) {
      return res.status(400).json({ error: "Could not update hospital." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Hospital not found." });
    }
    res.status(200).json({ message: "Hospital updated successfully" });
  });
});

// Add Department Route
app.post("/department/add", (req, res) => {
  const { hospital_name, department_name } = req.body;

  if (!hospital_name || !department_name) {
    return res.status(400).json({ error: "Hospital name and department name are required." });
  }

  db.run(
    `INSERT INTO departments (hospital_name, department_name) VALUES (?, ?)`,
    [hospital_name, department_name],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Could not add department." });
      }
      res.status(201).json({ message: "Department added successfully", departmentId: this.lastID });
    }
  );
});

// View Departments Route
app.get("/departments/:hospital_name", (req, res) => {
  const hospital_name = req.params.hospital_name;

  db.all(`SELECT * FROM departments WHERE hospital_name = ?`, [hospital_name], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve departments." });
    }
    res.status(200).json(rows);
  });
});

// Edit Department Route
app.put("/department/:id", (req, res) => {
  const departmentId = req.params.id;
  const { department_name } = req.body;

  if (!department_name) {
    return res.status(400).json({ error: "Department name is required." });
  }

  db.run(
    `UPDATE departments SET department_name = ? WHERE id = ?`,
    [department_name, departmentId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Could not update department." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Department not found." });
      }
      res.status(200).json({ message: "Department updated successfully" });
    }
  );
});

// Serve Department Management Page
app.get("/manage-departments", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "manage-departments.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});