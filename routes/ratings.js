const express = require("express");
const router = express.Router();

const db = require("../database/db");
const auth = require("../middleware/auth");

// POST /ratings/rentals/:id
router.post("/rentals/:id", auth, async (req, res) => {

    try {

        const rentalId = req.params.id;
        const userEmail = req.user.email;

        const { rating, comment } = req.body;

        // check rating exists
        if (rating === undefined) {
            return res.status(400).json({
                error: true,
                message: "Rating is required"
            });
        }

        // rating validation
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: true,
                message: "Rating must be between 1 and 5"
            });
        }

        // insert rating
        await db("ratings").insert({
            rentalId,
            userEmail,
            rating,
            comment
        });

        res.status(201).json({
            message: "Rating added"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

module.exports = router;