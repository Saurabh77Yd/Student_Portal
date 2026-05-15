import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import app from "./app";

const PORT   = Number(process.env.PORT) || 5000;
const MONGO_URI=process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

async function bootstrap(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  process.exit(0);
});

bootstrap();