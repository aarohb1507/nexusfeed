const express = require("express");
const { searchPostController, manualSync } = require("../controller/search-controller");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateUser);

router.get("/posts", searchPostController);
router.post("/sync", manualSync); // Admin endpoint for manual sync

module.exports = router;