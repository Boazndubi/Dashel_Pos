const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/prisma");

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "staff", "cashier", "auditor"]),
});

const roleSchema = z.object({
  role: z.enum(["admin", "staff", "cashier", "auditor"]),
});

function toPrismaRole(role) {
  return role.toUpperCase();
}

function serializeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.toLowerCase(),
    createdAt: user.createdAt,
  };
}

async function listUsers(req, res) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  res.json(users.map(serializeUser));
}

async function createUser(req, res) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: toPrismaRole(data.role),
      },
    });

    res.status(201).json(serializeUser(user));
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Failed to create user" });
  }
}

async function updateUserRole(req, res) {
  try {
    const { role } = roleSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: toPrismaRole(role) },
    });

    res.json(serializeUser(user));
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
    res.status(500).json({ error: "Failed to update role" });
  }
}

async function deleteUser(req, res) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
    res.status(500).json({ error: "Failed to delete user" });
  }
}

module.exports = { listUsers, createUser, updateUserRole, deleteUser };
