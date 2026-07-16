const prisma = require("../config/prisma");
const {
  getPeriodRange,
  getPreviousPeriodRange,
  percentChange,
  addDays,
  startOfDay,
} = require("../utils/dateRanges");

async function sumOrdersInRange(start, end) {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "paid", createdAt: { gte: start, lte: end } },
  });

  const amount = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const cash = orders
    .filter((o) => o.paymentMethod === "cash")
    .reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const mpesa = orders
    .filter((o) => o.paymentMethod === "mpesa")
    .reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const card = orders
    .filter((o) => o.paymentMethod === "card")
    .reduce((sum, o) => sum + Number(o.grandTotal), 0);

  return { amount, sales: orders.length, cash, mpesa, card };
}

async function buildSalesPeriod(period) {
  const { start, end } = getPeriodRange(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period);

  const current = await sumOrdersInRange(start, end);
  const previous = await sumOrdersInRange(prevStart, prevEnd);

  return {
    amount: current.amount,
    sales: current.sales,
    change: percentChange(current.amount, previous.amount),
    cash: current.cash,
    mobileMoney: current.mpesa,
    credit: current.card,
    mpesa: current.mpesa,
  };
}

async function buildProfitPeriod(period) {
  const { start, end } = getPeriodRange(period);

  const items = await prisma.orderItem.findMany({
    where: { order: { paymentStatus: "paid", createdAt: { gte: start, lte: end } } },
    include: { product: true },
  });

  const sales = items.reduce((sum, i) => sum + Number(i.total), 0);
  const costOfGoods = items.reduce(
    (sum, i) => sum + Number(i.product.costPrice || 0) * i.quantity,
    0
  );
  // No expense-tracking table yet - always 0 until one is added.
  const expenses = 0;

  return {
    amount: sales - costOfGoods - expenses,
    sales,
    costOfGoods,
    expenses,
  };
}

async function getDashboard(req, res) {
  try {
    const now = new Date();

    const [salesToday, salesYesterday, salesWeek, salesMonth, salesYear] = await Promise.all([
      buildSalesPeriod("today"),
      buildSalesPeriod("yesterday"),
      buildSalesPeriod("thisWeek"),
      buildSalesPeriod("thisMonth"),
      buildSalesPeriod("thisYear"),
    ]);

    const [profitToday, profitYesterday, profitWeek, profitMonth, profitYear] = await Promise.all([
      buildProfitPeriod("today"),
      buildProfitPeriod("yesterday"),
      buildProfitPeriod("thisWeek"),
      buildProfitPeriod("thisMonth"),
      buildProfitPeriod("thisYear"),
    ]);

    // ─── Stats ───
    const [totalProducts, activeProducts, allProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "active" } }),
      prisma.product.findMany(),
    ]);
    const lowStockProducts = allProducts.filter((p) => p.quantity <= p.lowStockThreshold);

    const todayRange = getPeriodRange("today");
    const itemsSoldTodayAgg = await prisma.orderItem.findMany({
      where: {
        order: { paymentStatus: "paid", createdAt: { gte: todayRange.start, lte: todayRange.end } },
      },
    });
    const itemsSoldToday = itemsSoldTodayAgg.reduce((sum, i) => sum + i.quantity, 0);
    const staffActive = await prisma.user.count();

    // ─── Revenue trends: last 12 months ───
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueTrends = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const { amount } = await sumOrdersInRange(start, end);
      revenueTrends.push({ month: monthNames[d.getMonth()], revenue: amount });
    }

    // ─── Weekly sales: last 7 days ───
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const start = startOfDay(d);
      const end = new Date(start.getTime() + 86399999);
      const { amount } = await sumOrdersInRange(start, end);
      const items = await prisma.orderItem.findMany({
        where: { order: { paymentStatus: "paid", createdAt: { gte: start, lte: end } } },
        include: { product: true },
      });
      const cost = items.reduce((sum, it) => sum + Number(it.product.costPrice || 0) * it.quantity, 0);
      weeklySales.push({ day: dayNames[d.getDay()], sales: amount, profit: amount - cost });
    }

    // ─── Peak hours today ───
    const todayOrders = await prisma.order.findMany({
      where: { paymentStatus: "paid", createdAt: { gte: todayRange.start, lte: todayRange.end } },
    });
    const hourBuckets = {};
    for (const o of todayOrders) {
      const hour = new Date(o.createdAt).getHours();
      const label = `${String(hour).padStart(2, "0")}:00`;
      hourBuckets[label] = (hourBuckets[label] || 0) + Number(o.grandTotal);
    }
    const peakHours = Object.entries(hourBuckets)
      .map(([hour, sales]) => ({ hour, sales }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // ─── Payment breakdown (year-to-date) ───
    const paymentBreakdown = [
      { name: "Cash", value: salesYear.cash, color: "#3b82f6" },
      { name: "M-Pesa", value: salesYear.mpesa, color: "#10b981" },
      { name: "Card", value: salesYear.credit, color: "#f59e0b" },
    ];

    // ─── Top products (year-to-date, by quantity sold) ───
    const yearRange = getPeriodRange("thisYear");
    const yearItems = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: "paid", createdAt: { gte: yearRange.start, lte: yearRange.end } } },
      include: { product: true },
    });
    const productTotals = {};
    for (const item of yearItems) {
      const key = item.productId;
      if (!productTotals[key]) {
        productTotals[key] = { name: item.product.name, sales: 0, revenue: 0 };
      }
      productTotals[key].sales += item.quantity;
      productTotals[key].revenue += Number(item.total);
    }
    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    // ─── Recent sales ───
    const recentOrders = await prisma.order.findMany({
      where: { paymentStatus: "paid" },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const recentSales = recentOrders.map((o) => ({
      id: o.orderNumber,
      cashier: o.user ? `${o.user.firstName} ${o.user.lastName}` : "Unknown",
      method: o.paymentMethod,
      amount: Number(o.grandTotal),
      time: o.createdAt,
    }));

    // ─── Low stock ───
    const lowStock = lowStockProducts.map((p) => ({
      name: p.name,
      stock: p.quantity,
      reorderLevel: p.lowStockThreshold,
    }));

    res.json({
      sales: {
        today: salesToday,
        yesterday: salesYesterday,
        thisWeek: salesWeek,
        thisMonth: salesMonth,
        thisYear: salesYear,
      },
      profit: {
        today: profitToday,
        yesterday: profitYesterday,
        thisWeek: profitWeek,
        thisMonth: profitMonth,
        thisYear: profitYear,
      },
      stats: {
        itemsSoldToday,
        totalProducts,
        activeProducts,
        lowStockItems: lowStock.length,
        staffActive,
      },
      revenueTrends,
      weeklySales,
      peakHours,
      paymentBreakdown,
      topProducts,
      recentSales,
      lowStock,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
}

module.exports = { getDashboard };
