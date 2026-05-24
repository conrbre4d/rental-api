const express = require("express");
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

// POST /user/register
router.post("/register", async (req, res) => {

    try {

        const { email, password } = req.body;

        // check missing fields
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: "Request body incomplete - email and password needed"
            });
        }

        // check if user already exists
        const existingUser = await db("users")
            .where("email", email)
            .first();

        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: "User already exists"
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // insert user
        await db("users").insert({
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User created"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// POST /user/login
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // missing fields
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: "Request body incomplete - email and password needed"
            });
        }

        // find user
        const user = await db("users")
            .where("email", email)
            .first();

        // invalid email
        if (!user) {
            return res.status(401).json({
                error: true,
                message: "Incorrect email or password"
            });
        }

        // compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                error: true,
                message: "Incorrect email or password"
            });
        }

        // create JWT token
        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            token,
            tokenType: "Bearer",
            expiresIn: 86400
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// POST /user/debugLogin
router.post("/debugLogin", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db("users").where("email", email).first();

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                error: true,
                message: "Incorrect email or password"
            });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1s" }
        );

        res.json({
            token,
            tokenType: "Bearer",
            expiresIn: 1
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// GET /user/test-auth
router.get("/test-auth", auth, async (req, res) => {

    res.json({
        message: "Authorized",
        user: req.user
    });

});

module.exports = router;