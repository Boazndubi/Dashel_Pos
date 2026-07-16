const express = require("express");
const { initiate } = require("../controllers/pesapalController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/initiate", initiate);

module.exports = router;
