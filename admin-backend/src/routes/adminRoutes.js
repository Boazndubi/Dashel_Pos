const express = require("express");
const {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/adminUserController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
