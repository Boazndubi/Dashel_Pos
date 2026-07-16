require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const mpesaRoutes = require("./routes/mpesaRoutes");
const pesapalRoutes = require("./routes/pesapalRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/pesapal", pesapalRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Admin backend running on port ${PORT}`));
