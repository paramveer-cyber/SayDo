import express from "express";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import { corsair } from "./corsair.js";
const app = express();
app.use(express.json());
app.use("/mcp", createMcpRouter(() => createBaseMcpServer({ corsair })));
app.listen(3000, () => console.log("MCP server on :3000"));
//# sourceMappingURL=mcp-server.js.map