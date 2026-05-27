const express = require("express");
const db = require("./database/db");

const app = express();
const PORT = 3000;

const rentalsRoutes = require("./routes/rentals");
const usersRoutes = require("./routes/users");
const ratingsRoutes = require("./routes/ratings");

const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

app.use(express.json());

app.use("/docs", swaggerUI.serve);
app.get("/docs", swaggerUI.setup(swaggerDocument));

app.get("/", (req, res) => {
    res.json({ message: "Rental API is running" });
});

app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.raw("SELECT 1 + 1 AS result");

        res.json({
            message: "Database connected",
            result: rows[0].result
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database connection failed"
        });
    }
});

app.use("/rentals", rentalsRoutes);
app.use("/user", usersRoutes);
app.use("/ratings", ratingsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});