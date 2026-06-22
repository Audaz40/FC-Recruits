import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { generalRateLimit, strictRateLimit, searchRateLimit } from "./middlewares/rateLimit";
import { errorHandler } from "./middlewares/errorHandler";

const app: Express = express();

// Web security: Set security HTTP headers
app.use(helmet());

// Web security: Prevent HTTP Parameter Pollution
app.use(hpp());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Web security: Restrict CORS (using a generic setup, ideally should be an env var)
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

// Web security: Limit body payload size to prevent DoS attacks
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Apply general rate limiting to all requests
app.use(generalRateLimit);

app.use("/api", router);

// Global error handler
app.use(errorHandler);

export default app;
