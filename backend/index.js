const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "env") });
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is required in backend/.env");
  process.exit(1);
}
if (!process.env.SECRET_KEY) {
  console.error("SECRET_KEY is required in backend/.env");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { apiLimiter } = require("./middleware/rateLimit");
const { isLocalAws, getAwsEndpoint, getSesFromEmail } = require("./aws/env");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const agencyRoutes = require("./routes/agency.route");
const agentRoutes = require("./routes/agent.route");
const vesselOwnerRoutes = require("./routes/vesselOwner.route");
const vesselRoutes = require("./routes/vessel.route");
const candidateRoutes = require("./routes/candidate.route");
const filesRoutes = require("./routes/files.route");
const feedbackRoutes = require("./routes/feedback.route");
const rankRoutes = require("./routes/rank.route");
const vesselTypeRoutes = require("./routes/vesselType.route");
const vacancyRoutes = require("./routes/vacancy.route");
const proposalRoutes = require("./routes/proposal.route");
const documentationRoutes = require("./routes/documentation.route");
const sailingRoutes = require("./routes/sailing.route");

const { connectToDB } = require("./database/db");
const { errorHandler } = require("./middleware/errorHandler");
const { verifyToken } = require("./middleware/VerifyToken");
const { requireAccountActive } = require("./middleware/requireAccountActive");

const server = express();
const PORT = Number(process.env.PORT) || 8000;

server.use(apiLimiter);
server.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
    exposedHeaders: ["X-Total-Count"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  }),
);
server.use(express.json());
server.use(cookieParser());
server.use(morgan("tiny"));

server.use("/auth", authRoutes);

const protectedApi = express.Router();
protectedApi.use(verifyToken);
protectedApi.use(requireAccountActive);
protectedApi.use("/users", userRoutes);
protectedApi.use("/agencies", agencyRoutes);
protectedApi.use("/agents", agentRoutes);
protectedApi.use("/vesselOwners", vesselOwnerRoutes);
protectedApi.use("/vessels", vesselRoutes);
protectedApi.use("/candidates", candidateRoutes);
protectedApi.use("/files", filesRoutes);
protectedApi.use("/feedbacks", feedbackRoutes);
protectedApi.use("/ranks", rankRoutes);
protectedApi.use("/vesselTypes", vesselTypeRoutes);
protectedApi.use("/vacancies", vacancyRoutes);
protectedApi.use("/proposals", proposalRoutes);
protectedApi.use("/documentation", documentationRoutes);
protectedApi.use("/sailings", sailingRoutes);
server.use(protectedApi);

server.get("/", (req, res) => {
  res.status(200).json({ message: "running" });
});

server.use(errorHandler);

async function start() {
  await connectToDB();
  server.listen(PORT, () => {
    const storage = isLocalAws()
      ? `LocalStack @ ${getAwsEndpoint()}`
      : `AWS S3 bucket "${process.env.S3_BUCKET_NAME}" (${process.env.AWS_REGION || "us-east-1"})`;
    console.log(`server [STARTED] ~ http://localhost:${PORT}`);
    console.log(`file storage: ${storage}`);
    console.log(
      `email: ${process.env.EMAIL_PROVIDER || "ses"} from ${getSesFromEmail()}`,
    );
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
