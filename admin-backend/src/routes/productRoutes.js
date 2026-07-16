const express = require("express");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", requireRole("ADMIN", "STAFF"), createProduct);
router.put("/:id", requireRole("ADMIN", "STAFF"), updateProduct);
router.delete("/:id", requireRole("ADMIN", "STAFF"), deleteProduct);

module.exports = router;
