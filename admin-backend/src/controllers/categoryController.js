const { z } = require("zod");
const prisma = require("../config/prisma");

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  res.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      products: c._count.products,
    }))
  );
}

async function createCategory(req, res) {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, slug: slugify(data.name) },
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2002") return res.status(409).json({ error: "Category name already exists" });
    res.status(500).json({ error: "Failed to create category" });
  }
}

async function updateCategory(req, res) {
  try {
    const data = categorySchema.partial().parse(req.body);
    const updateData = { ...data };
    if (data.name) updateData.slug = slugify(data.name);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(category);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2025") return res.status(404).json({ error: "Category not found" });
    res.status(500).json({ error: "Failed to update category" });
  }
}

async function deleteCategory(req, res) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Category not found" });
    res.status(500).json({ error: "Failed to delete category" });
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
