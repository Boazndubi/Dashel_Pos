const { z } = require("zod");
const prisma = require("../config/prisma");

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

async function listContacts(req, res) {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  res.json(contacts);
}

async function createContact(req, res) {
  try {
    const data = contactSchema.parse(req.body);
    const contact = await prisma.contact.create({ data });
    res.status(201).json(contact);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Failed to create contact" });
  }
}

async function updateContact(req, res) {
  try {
    const data = contactSchema.partial().parse(req.body);
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data });
    res.json(contact);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2025") return res.status(404).json({ error: "Contact not found" });
    res.status(500).json({ error: "Failed to update contact" });
  }
}

async function deleteContact(req, res) {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Contact not found" });
    res.status(500).json({ error: "Failed to delete contact" });
  }
}

module.exports = { listContacts, createContact, updateContact, deleteContact };
