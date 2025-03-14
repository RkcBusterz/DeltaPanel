const users = require("./features/users")
const cookieParser = require("cookie-parser")
require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = 1321;
(async () => {
    const data = await users.getUserByEmail(process.env.default_admin);
    if (!data) {
        await users.addUser(process.env.default_admin, "admin", process.env.default_user_pass, 1);
    }

})();

async function authenticate(req, res, next) {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
        return res.redirect("/login"); // ✅ Added `return`
    }

    const user = await users.getUserBySession(sessionId);
    if (!user) {
        return res.redirect("/login"); // ✅ Added `return`
    }

    req.user = user;
    next();
}



//routes
app.get("/login", async (req, res) => {
    if (req.cookies.session_id) {
        const data = await users.getUserBySession(req.cookies.session_id);
        if (data) return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/",authenticate,(req,res) =>{
res.send("Authorised")
})


app.post("/auth", async (req, res) => {
    try {
        const user_check = await users.getUserByEmailAndPassword(req.body.email, req.body.password);
        if (user_check) {
            res.cookie("session_id", user_check.session_id, {
                httpOnly: true,
                secure: false,
                maxAge: 60 * 60 * 1000 * 24 * 2,
                sameSite: "Strict"
            });


        }
        res.status(401).json({ error: "Invalid credentials" }); // Send error if user not found
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" }); // Handle server errors
    }
});


app.listen(PORT, "0.0.0.0",() => {
    console.log(`Server running on http://localhost:${PORT}`);
});