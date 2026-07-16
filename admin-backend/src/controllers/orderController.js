const { z } = require("zod");
const prisma = require("../config/prisma");

const posOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentMethod: z.enum(["cash", "mpesa", "card"]).default("cash"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);
  return `ORD-${timestamp}${random}`;
}

async function createPosOrder(req, res) {
  try {
    const data = posOrderSchema.parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemsData = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw { code: "NOT_FOUND", message: `Product ${item.productId} not found` };
        if (product.quantity < item.quantity) {
          throw { code: "INSUFFICIENT_STOCK", message: `Insufficient stock for ${product.name}` };
        }

        const unitPrice = Number(product.basePrice);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        itemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          total: itemTotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Cash and card are marked paid immediately (card confirmed via Pesapal redirect
      // flow separately, but we optimistically record the order here).
      // M-Pesa stays pending until the STK push callback/poll confirms it.
      const paymentStatus = data.paymentMethod === "mpesa" ? "pending" : "paid";

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user?.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          subtotal,
          grandTotal: subtotal,
          paymentMethod: data.paymentMethod,
          paymentStatus,
          channel: "pos",
          items: { create: itemsData },
        },
        include: { items: { include: { product: true } } },
      });
    });

    res.status(201).json(order);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "INSUFFICIENT_STOCK" || err.code === "NOT_FOUND") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to complete sale" });
  }
}

async function listOrders(req, res) {
  const { status, search } = req.query;

  const where = {};
  if (status && status !== "all") where.paymentStatus = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = orders.map((o) => ({
    ...o,
    user: o.user
      ? { firstName: o.user.firstName, lastName: o.user.lastName, email: o.user.email }
      : undefined,
  }));

  res.json(serialized);
}

async function getOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
}

module.exports = { createPosOrder, listOrders, getOrder };
