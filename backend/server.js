const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");

console.log("🔥 SIGNUP FIX VERSION RUNNING 🔥");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.send("Server is LIVE 🚀");
});

// ================= EVENTS =================


// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { user_id, event_id } = req.body;

  const query = `
    INSERT INTO Registration 
    (Registration_date, Registration_time, User_id, Event_id)
    VALUES (CURDATE(), CURTIME(), ?, ?)`;

  db.query(query, [user_id, event_id], (err, result) => {
    if (err) return res.json({ error: err });
    res.json({ message: "Registered Successfully" });
  });
});

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("SIGNUP DATA:", name, email, password);

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO Users (Name, Email, Password)
      VALUES (?, ?, ?)`;

    db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.json({ success: false, message: "Signup failed (duplicate email?)" });
      }

      // ✅ IMPORTANT: Always send response
      return res.json({
        success: true,
        message: "Signup successful"
      });
    });

  } catch (err) {
    console.log("HASH ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM Users WHERE Email = ?";

  db.query(query, [email], async (err, result) => {
    if (err) return res.json({ success: false });

    if (result.length === 0) {
      return res.json({ success: false });
    }

    const user = result[0];

    // 🔐 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.Password);

    if (isMatch) {
      res.json({
        success: true,
        user: user
      });
    } else {
      res.json({ success: false });
    }
  });
});

app.post("/create-event", (req, res) => {
  const { name, date, time, request, user_id } = req.body;

  if (!name || !date || !time || !user_id) {
    return res.json({ success: false, message: "Missing data" });
  }

  const query = `
    INSERT INTO Event (Event_name, Event_date, Event_time, Request, User_id)
    VALUES (?, ?, ?, ?, ?)`;

  db.query(query, [name, date, time, request, user_id], (err) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ success: false });
    }

    res.json({ success: true });
  });
});

// ================= USERS (ADMIN) =================
app.get("/users", (req, res) => {
  db.query("SELECT * FROM Users", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.get("/test", (req, res) => {
  console.log("🔥 TEST ROUTE HIT");
  res.send("Working");
});

app.delete("/delete-event/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM Event WHERE Event_id = ?", [id], (err) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    res.json({ success: true });
  });
});


app.get("/events/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  console.log("🔥 USER EVENTS HIT:", user_id);

  const query = `
    SELECT * FROM Event 
    WHERE User_id = ?
    ORDER BY Event_date`;

  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json([]);
    }

    res.json(result);
  });
});

// ================= USER BOOKINGS =================
app.get("/my-bookings/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const query = `
    SELECT * FROM Event WHERE User_id = ?

    UNION

    SELECT e.*
    FROM Registration r
    JOIN Event e ON r.Event_id = e.Event_id
    WHERE r.User_id = ?`;

  db.query(query, [user_id, user_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);
  });
});


// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});