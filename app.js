const express = require("express");

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
    res.redirect("/docs");
});

app.use("/rentals", rentalsRoutes);
app.use("/user", usersRoutes);
app.use("/ratings", ratingsRoutes);

const credentials = {
    key: fs.readFileSync("./certs/selfsigned.key"),
    cert: fs.readFileSync("./certs/selfsigned.crt")
};

https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});