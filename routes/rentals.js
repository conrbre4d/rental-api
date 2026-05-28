const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET /rentals/states
router.get("/states", async (req, res) => {
    try {
        const queryParams = Object.keys(req.query);

        if (queryParams.length > 0) {
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(", ")}`
            });
        }

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

        const queryParams = Object.keys(req.query);

        if (queryParams.length > 0) {
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(", ")}`
            });
        }

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

        // current page
        const page = req.query.page ? Number(req.query.page) : 1;

        // rentals per page
        const perPage = 10;

        // validate page
        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                error: true,
                message: "Invalid page parameter. Must be an integer greater than or equal to 1."
            });
        }

        let query = db("data");

        // check if value is a non-negative integer
        const validateNonNegativeInteger = (value) => {
            return Number.isInteger(Number(value)) && Number(value) >= 0;
        };

        // suburb filter
        if (req.query.suburb) {
            query = query.where("suburb", "like", `%${req.query.suburb}%`);
        }

        // state filter
        if (req.query.state) {
            query = query.where("state", req.query.state);
        }

        // postcode filter
        if (req.query.postcode !== undefined) {

            if (!validateNonNegativeInteger(req.query.postcode) || Number(req.query.postcode) > 9999) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid postcode parameter. Must be an integer in the range of 0000-9999."
                });
            }

            query = query.where("postcode", Number(req.query.postcode));
        }

        // minimum rent filter
        if (req.query.minimumRent !== undefined) {

            if (!validateNonNegativeInteger(req.query.minimumRent)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid minimumRent parameter. Must be a non-negative integer."
                });
            }

            query = query.where("rent", ">=", Number(req.query.minimumRent));
        }

        // maximum rent filter
        if (req.query.maximumRent !== undefined) {

            if (!validateNonNegativeInteger(req.query.maximumRent)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid maximumRent parameter. Must be a non-negative integer."
                });
            }

            query = query.where("rent", "<=", Number(req.query.maximumRent));
        }

        // minimum bathrooms filter
        if (req.query.minimumBathrooms !== undefined) {

            if (!validateNonNegativeInteger(req.query.minimumBathrooms)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid minimumBathrooms parameter. Must be a non-negative integer."
                });
            }

            query = query.where("bathrooms", ">=", Number(req.query.minimumBathrooms));
        }

        // maximum bathrooms filter
        if (req.query.maximumBathrooms !== undefined) {

            if (!validateNonNegativeInteger(req.query.maximumBathrooms)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid maximumBathrooms parameter. Must be a non-negative integer."
                });
            }

            query = query.where("bathrooms", "<=", Number(req.query.maximumBathrooms));
        }

        // minimum bedrooms filter
        if (req.query.minimumBedrooms !== undefined) {

            if (!validateNonNegativeInteger(req.query.minimumBedrooms)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid minimumBedrooms parameter. Must be a non-negative integer."
                });
            }

            query = query.where("bedrooms", ">=", Number(req.query.minimumBedrooms));
        }

        // maximum bedrooms filter
        if (req.query.maximumBedrooms !== undefined) {

            if (!validateNonNegativeInteger(req.query.maximumBedrooms)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid maximumBedrooms parameter. Must be a non-negative integer."
                });
            }

            query = query.where("bedrooms", "<=", Number(req.query.maximumBedrooms));
        }

        // minimum parking filter
        if (req.query.minimumParking !== undefined) {

            if (!validateNonNegativeInteger(req.query.minimumParking)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid minimumParking parameter. Must be a non-negative integer."
                });
            }

            query = query.where("parkingSpaces", ">=", Number(req.query.minimumParking));
        }

        // maximum parking filter
        if (req.query.maximumParking !== undefined) {

            if (!validateNonNegativeInteger(req.query.maximumParking)) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid maximumParking parameter. Must be a non-negative integer."
                });
            }

            query = query.where("parkingSpaces", "<=", Number(req.query.maximumParking));
        }

        // property types filter
        if (req.query.propertyTypes) {

            const propertyTypes = Array.isArray(req.query.propertyTypes)
                ? req.query.propertyTypes
                : [req.query.propertyTypes];

            query = query.whereIn("propertyType", propertyTypes);
        }

        // sortOrder needs sortBy
        if (req.query.sortOrder && !req.query.sortBy) {
            return res.status(400).json({
                error: true,
                message: "Invalid sortOrder parameter. sortBy must be specified."
            });
        }

        // sorting field
        const sortBy = req.query.sortBy || "id";

        // sorting order
        const sortOrder = req.query.sortOrder || "asc";

        // valid sorting fields
        const validSortFields = [
            "id",
            "title",
            "rent",
            "propertyType",
            "latitude",
            "longitude",
            "postcode",
            "state",
            "suburb",
            "bathrooms",
            "bedrooms",
            "parkingSpaces",
            "averageRating",
            "numRatings"
        ];

        // validate sortBy
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({
                error: true,
                message: "Invalid sortBy parameter. Must refer to a valid sortable property."
            });
        }

        // validate sortOrder
        if (!["asc", "desc"].includes(sortOrder)) {
            return res.status(400).json({
                error: true,
                message: "Invalid sortOrder parameter. Must be 'asc' or 'desc'."
            });
        }

        // apply sorting
        query = query.orderBy(sortBy, sortOrder);

        // total number of rentals
        const countResult = await query.clone().count("* as count").first();

        const total = Number(countResult.count);

        // apply pagination
        const rentals = await query
            .limit(perPage)
            .offset((page - 1) * perPage);

        // add rating data and fix number types
        for (const rental of rentals) {

            rental.latitude = Number(rental.latitude);
            rental.longitude = Number(rental.longitude);

            const ratings = await db("ratings")
                .where("rentalId", rental.id);

            rental.numRatings = ratings.length;

            if (ratings.length > 0) {
                let totalRating = 0;

                for (const r of ratings) {
                    totalRating += r.rating;
                }

                rental.averageRating = totalRating / ratings.length;
            } else {
                rental.averageRating = null;
            }
        }

        res.json({
            data: rentals,
            pagination: {
                total,
                lastPage: Math.ceil(total / perPage),
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < Math.ceil(total / perPage) ? page + 1 : null,
                perPage,
                currentPage: page,
                from: (page - 1) * perPage,
                to: Math.min(page * perPage, total)
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

// GET /rentals/:id
router.get("/:id", async (req, res) => {
    try {

        const queryParams = Object.keys(req.query);

        if (queryParams.length > 0) {
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(", ")}`
            });
        }

        const rental = await db("data")
            .where("id", req.params.id)
            .first();

        if (!rental) {
            return res.status(404).json({
                error: true,
                message: "Rental not found"
            });
        }

        const reviewsRaw = await db("ratings")
            .where("rentalId", req.params.id)
            .select(
                "rating",
                "userEmail as user",
                "comment",
                "dateTime"
            );

        const reviews = reviewsRaw.map(r => {
            const reviewObj = {
                rating: r.rating,
                user: r.user,
                dateTime: r.dateTime
            };

            if (r.comment) {
                reviewObj.comment = r.comment;
            }

            return reviewObj;
        });

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

        rental.latitude = Number(rental.latitude);
        rental.longitude = Number(rental.longitude);

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