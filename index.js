require("dotenv").config(); // ✅ Load .env first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(morgan("combined"));

app.use("/api", groupRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected");
      break;
    } catch (err) {
      console.error("MongoDB connection error:", err);
      retries -= 1;
      if (retries === 0) {
        console.error("Failed to connect to MongoDB after retries");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
