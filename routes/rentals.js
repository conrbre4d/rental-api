const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET /rentals/states
router.get("/states", async (req, res) => {
    try {
        const states = await db("data")
            .distinct("state")
            .whereNotNull("state")
            .orderBy("state");

        res.json(states.map(row => row.state));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// GET /rentals/property-types
router.get("/property-types", async (req, res) => {
    try {
        const types = await db("data")
            .distinct("propertyType")
            .whereNotNull("propertyType")
            .orderBy("propertyType");

        res.json(types.map(row => row.propertyType));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// GET /rentals/search
router.get("/search", async (req, res) => {
    try {

        let query = db("data");

        // suburb filter
        if (req.query.suburb) {
            query = query.where("suburb", "like", `%${req.query.suburb}%`);
        }

        // state filter
        if (req.query.state) {
            query = query.where("state", req.query.state);
        }

        // minimum bedrooms
        if (req.query.bedrooms) {
            query = query.where("bedrooms", ">=", req.query.bedrooms);
        }

        // limit results
        const rentals = await query.limit(20);

        res.json(rentals);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

// GET /rentals/:id
router.get("/:id", async (req, res) => {
    try {
        const rental = await db("data")
            .where("id", req.params.id)
            .first();

        if (!rental) {
            return res.status(404).json({
                error: true,
                message: "Rental not found"
            });
        }

        const reviews = await db("ratings")
            .where("rentalId", req.params.id)
            .select(
                "rating",
                "userEmail as user",
                "comment",
                "dateTime"
            );

        rental.reviews = reviews;

        // get all ratings for this rental
        const ratings = await db("ratings")
            .where("rentalId", req.params.id);

        // number of ratings
        rental.numRatings = ratings.length;

        // calculate average rating
        if (ratings.length > 0) {

            let total = 0;

            for (const r of ratings) {
                total += r.rating;
            }

            rental.averageRating = total / ratings.length;

        } else {

            rental.averageRating = null;
        }

        res.json(rental);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: true,
            message: "Database error"
        });
    }
});

module.exports = router;