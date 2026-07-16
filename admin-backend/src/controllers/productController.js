const { z } = require("zod");
const prisma = require("../config/prisma");

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  costPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sku: z.string().optional(),
  featuredImageUrl: z.string().url().optional(),
});

async function listProducts(req, res) {
  const { search, categoryId, limit } = req.query;

  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: limit ? Number(limit) : undefined,
  });

  res.json(products);
}

async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

async function createProduct(req, res) {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2002") return res.status(409).json({ error: "SKU already exists" });
    res.status(500).json({ error: "Failed to create product" });
  }
}

async function updateProduct(req, res) {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(product);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2025") return res.status(404).json({ error: "Product not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "SKU already exists" });
    res.status(500).json({ error: "Failed to update product" });
  }
}

async function deleteProduct(req, res) {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Product not found" });
    res.status(500).json({ error: "Failed to delete product" });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
