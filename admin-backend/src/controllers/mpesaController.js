const { z } = require("zod");
const prisma = require("../config/prisma");

const stkPushSchema = z.object({
  phone: z.string().min(9),
  amount: z.number().positive(),
  orderId: z.string().uuid(),
  orderNumber: z.string(),
});

// ─── Simulation mode ───
// MPESA_SIMULATE=true (default) auto-marks the order paid after a short delay,
// so the POS flow works end-to-end without real Daraja credentials.
// Set MPESA_SIMULATE=false and fill in MPESA_* env vars to wire up the real
// Safaricom Daraja STK push API here instead.
async function stkPush(req, res) {
  try {
    const data = stkPushSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const checkoutRequestId = `SIM-${Date.now()}`;
    await prisma.order.update({
      where: { id: data.orderId },
      data: { mpesaCheckoutId: checkoutRequestId, paymentStatus: "pending" },
    });

    if (process.env.MPESA_SIMULATE !== "false") {
      // Simulates the customer entering their M-Pesa PIN after a few seconds.
      setTimeout(async () => {
        try {
          await prisma.order.update({
            where: { id: data.orderId },
            data: { paymentStatus: "paid" },
          });
        } catch (err) {
          console.error("Simulated M-Pesa callback failed:", err.message);
        }
      }, 5000);

      return res.json({
        message: "STK push sent (simulated)",
        checkoutRequestId,
      });
    }

    // TODO: real Daraja STK push request goes here using MPESA_CONSUMER_KEY,
    // MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL.
    return res.status(501).json({ error: "Real M-Pesa integration not yet configured" });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Failed to initiate M-Pesa STK push" });
  }
}

async function checkStatus(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ paymentStatus: order.paymentStatus });
}

// TODO: real Daraja callback endpoint (POST /mpesa/callback) goes here to
// receive Safaricom's confirmation and update paymentStatus accordingly.

module.exports = { stkPush, checkStatus };
