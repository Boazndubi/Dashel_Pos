const express = require("express");
const {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
} = require("../controllers/contactController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", listContacts);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

module.exports = router;
