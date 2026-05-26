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

// GET /user/:email/profile
router.get("/:email/profile", async (req, res) => {
    try {
        const email = req.params.email;

        const user = await db("users")
            .where("email", email)
            .first();

        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User not found"
            });
        }

        // default public profile
        const profile = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };

        // if Authorization header exists, check if user owns profile
        const authHeader = req.headers.authorization;

        if (authHeader) {
            if (!authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    error: true,
                    message: "Authorization header is malformed"
                });
            }

            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                if (decoded.email === email) {
                    profile.dob = user.dob;
                    profile.address = user.address;
                }

            } catch (error) {
                if (error.name === "TokenExpiredError") {
                    return res.status(401).json({
                        error: true,
                        message: "JWT token has expired"
                    });
                }

                return res.status(401).json({
                    error: true,
                    message: "Invalid JWT token"
                });
            }
        }

        res.json(profile);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// PUT /user/:email/profile
router.put("/:email/profile", auth, async (req, res) => {
    try {
        const email = req.params.email;

        const user = await db("users").where("email", email).first();

        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User not found"
            });
        }

        if (req.user.email !== email) {
            return res.status(403).json({
                error: true,
                message: "Forbidden"
            });
        }

        const { firstName, lastName, dob, address } = req.body;

        if (
            firstName === undefined ||
            lastName === undefined ||
            dob === undefined ||
            address === undefined
        ) {
            return res.status(400).json({
                error: true,
                message: "Request body incomplete: firstName, lastName, dob and address are required."
            });
        }

        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof address !== "string"
        ) {
            return res.status(400).json({
                error: true,
                message: "Request body invalid: firstName, lastName and address must be strings only."
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(dob)) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
            });
        }

        const dobDate = new Date(dob);
        const today = new Date();

        if (Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
            });
        }

        if (dobDate >= today) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a date in the past."
            });
        }

        await db("users")
            .where("email", email)
            .update({
                firstName,
                lastName,
                dob,
                address
            });

        res.json({
            email,
            firstName,
            lastName,
            dob,
            address
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