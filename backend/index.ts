// import { createServer } from "node:http";
import { app } from "./src/app.js";
// import "dotenv/config";

app.listen(process.env.PORT, () => {
  console.log("http://localhost:3000");
});

// const server = createServer(app);
// const PORT = process.env.PORT ?? 3000;

// server.listen(PORT, () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
// });

// process.on("SIGINT", () => {
//   console.log("Exiting...");
//   server.close();
// });
