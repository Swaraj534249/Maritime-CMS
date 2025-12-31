require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/Auth");
const userRoutes = require("./routes/User");

const vesselOwnerRoutes = require("./routes/VesselOwner");
const vesselRoutes = require("./routes/Vessel");
const crewingAgentRoutes = require("./routes/CrewingAgent");

const { connectToDB } = require("./database/db");

// server init
const server = express();

// database connection
connectToDB();

// middlewares
server.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
    exposedHeaders: ["X-Total-Count"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
server.use(express.json());
server.use(cookieParser());
server.use(morgan("tiny"));

// serve uploads
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routeMiddleware
server.use("/auth", authRoutes);
server.use("/users", userRoutes);
server.use("/vesselOwners", vesselOwnerRoutes);
server.use("/vessels", vesselRoutes);
server.use("/crewingAgents", crewingAgentRoutes);

server.get("/", (req, res) => {
  res.status(200).json({ message: "running" });
});

server.listen(8000, () => {
  console.log("server [STARTED] ~ http://localhost:8000");
});
