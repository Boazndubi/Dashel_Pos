const express = require("express");
const { stkPush, checkStatus } = require("../controllers/mpesaController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/stkpush", stkPush);
router.get("/status/:orderId", checkStatus);

module.exports = router;
