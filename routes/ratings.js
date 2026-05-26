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

        // validate comment
        if (
            comment !== undefined &&
            (
                typeof comment !== "string" ||
                comment.length < 1 ||
                comment.length > 2000
            )
        ) {
            return res.status(400).json({
                error: true,
                message: "Invalid comment parameter. Comment must be a string 1-2000 characters long."
            });
        }

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
        const response = {
            rating: rating.rating,
            dateTime: rating.dateTime
        };

        if (rating.comment) {
            response.comment = rating.comment;
        }

        res.json(response);

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

        // remove comment field if no comment exists
        const cleanedRatings = ratings.map(r => {

            const ratingObj = {
                rentalId: r.rentalId,
                rating: r.rating,
                dateTime: r.dateTime
            };

            if (r.comment) {
                ratingObj.comment = r.comment;
            }

            return ratingObj;
        });

        res.json({
            data: cleanedRatings,
            pagination: {
                total: cleanedRatings.length,
                lastPage: 1,
                prevPage: null,
                nextPage: null,
                perPage: 20,
                currentPage: 1,
                from: 0,
                to: 20
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// POST /ratings/debugEraseRatings
router.post("/debugEraseRatings", async (req, res) => {

    try {

        // delete every row in ratings table
        await db("ratings").del();

        res.json({
            message: "All ratings successfully erased."
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