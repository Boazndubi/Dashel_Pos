const express = require("express");
const { createPosOrder, listOrders, getOrder } = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/pos", createPosOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);

module.exports = router;
