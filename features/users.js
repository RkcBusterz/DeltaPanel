const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const db = new sqlite3.Database("store.db", (err) => {
    if (err) console.error("Database connection failed:", err);
    else console.log("Connected to store.db");
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    session_id TEXT
)`);

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function generateSessionId() {
    return crypto.randomBytes(32).toString("hex");
}

function addUser(email, username, password, isAdmin = 0) {
    return new Promise((resolve, reject) => {
        const hashedPassword = hashPassword(password);
        const sessionId = generateSessionId();

        db.run(
            "INSERT INTO users (email, username, password, isAdmin, session_id) VALUES (?, ?, ?, ?, ?)",
            [email, username, hashedPassword, isAdmin, sessionId],
            (err) => {
                if (err) reject("Failed to add user");
                else resolve("User added successfully");
            }
        );
    });
}

function resetPassword(email, newPassword) {
    return new Promise((resolve, reject) => {
        const hashedPassword = hashPassword(newPassword);
        const newSessionId = generateSessionId();

        db.run(
            "UPDATE users SET password = ?, session_id = ? WHERE email = ?",
            [hashedPassword, newSessionId, email],
            (err) => {
                if (err) reject("Failed to reset password");
                else resolve("Password updated, session changed.");
            }
        );
    });
}

function removeUser(email) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM users WHERE email = ?", [email], (err) => {
            if (err) reject("Failed to remove user");
            else resolve("User removed successfully.");
        });
    });
}

function editUser(email, newDetails) {
    return new Promise((resolve, reject) => {
        const { username, isAdmin } = newDetails;

        db.run(
            "UPDATE users SET username = ?, isAdmin = ? WHERE email = ?",
            [username, isAdmin, email],
            (err) => {
                if (err) reject("Failed to edit user");
                else resolve("User updated successfully.");
            }
        );
    });
}

function validateSession(sessionId) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT email FROM users WHERE session_id = ?",
            [sessionId],
            (err, row) => {
                if (err) reject("Session validation failed");
                else resolve(row ? row.email : null);
            }
        );
    });
}

function listUsers() {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT email, username, isAdmin FROM users",
            [],
            (err, rows) => {
                if (err) reject("Failed to fetch users");
                else resolve(rows);
            }
        );
    });
}

module.exports = { addUser, resetPassword, removeUser, editUser, validateSession, listUsers };
