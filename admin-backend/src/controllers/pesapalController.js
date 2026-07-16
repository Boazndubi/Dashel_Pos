const { z } = require("zod");
const prisma = require("../config/prisma");

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  amount: z.number().positive(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// ─── Simulation mode ───
// PESAPAL_SIMULATE=true (default) returns a placeholder redirect URL so the
// POS flow completes end-to-end without real Pesapal credentials.
// Set PESAPAL_SIMULATE=false and fill in PESAPAL_* env vars to wire up the
// real Pesapal hosted-redirect flow (card data still never touches this
// backend - Pesapal's page collects it directly, same pattern as MiniMingle).
async function initiate(req, res) {
  try {
    const data = initiateSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const trackingId = `SIM-PESAPAL-${Date.now()}`;
    await prisma.order.update({
      where: { id: data.orderId },
      data: { pesapalTrackingId: trackingId, paymentStatus: "pending" },
    });

    if (process.env.PESAPAL_SIMULATE !== "false") {
      return res.json({
        redirectUrl: `about:blank#simulated-pesapal-checkout-${data.orderNumber}`,
        trackingId,
      });
    }

    // TODO: real Pesapal hosted-redirect request goes here using
    // PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_CALLBACK_URL.
    // Get an auth token, submit order details, and return the real redirectUrl.
    return res.status(501).json({ error: "Real Pesapal integration not yet configured" });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Failed to initiate card payment" });
  }
}

// TODO: real Pesapal IPN callback endpoint goes here to receive payment
// confirmation and update paymentStatus accordingly.

module.exports = { initiate };
