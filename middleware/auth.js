const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: true,
            message: "Authorization header ('Bearer token') not found"
        });
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: true,
            message: "Authorization header is malformed"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
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

module.exports = auth;