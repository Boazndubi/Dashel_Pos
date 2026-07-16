const express = require("express");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", listCategories);
router.post("/", requireRole("ADMIN"), createCategory);
router.put("/:id", requireRole("ADMIN"), updateCategory);
router.delete("/:id", requireRole("ADMIN"), deleteCategory);

module.exports = router;
