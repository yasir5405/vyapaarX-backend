import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

import app from ".";

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT Secret is not set");
}

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
