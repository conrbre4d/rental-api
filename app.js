const express = require("express");
const db = require("./database/db");

const app = express();
const PORT = 3000;

const rentalsRoutes = require("./routes/rentals");
const usersRoutes = require("./routes/users");
const ratingsRoutes = require("./routes/ratings");

const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

const https = require("https");
const fs = require("fs");

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

const credentials = {
    key: fs.readFileSync("./certs/selfsigned.key"),
    cert: fs.readFileSync("./certs/selfsigned.crt")
};

https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server listening on https://localhost:${PORT}`);
});