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

// GET /ratings/rentals/:id
router.get("/rentals/:id", auth, async (req, res) => {
    
    try {
        // find rating using rental id and logged-in user email
        const rating = await db("ratings")
            .where({
                rentalId: req.params.id,
                userEmail: req.user.email
            })
            .first();

        if (!rating) {
            return res.json({});
        }

        // send rating data
        res.json({
            rating: rating.rating,
            comment: rating.comment,
            dateTime: rating.dateTime
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// GET /ratings
router.get("/", auth, async (req, res) => {

    try {

        // get ratings for logged-in user
        const ratings = await db("ratings")
            .where("userEmail", req.user.email)
            .select(
                "rentalId",
                "rating",
                "comment",
                "dateTime"
            );

        // send ratings
        res.json({
            data: ratings
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