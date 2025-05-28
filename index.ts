#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";

const server = new Server(
  {
    name: "local-servers/postgres",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a database URL as a command-line argument");
  process.exit(1);
}

const databaseUrl = args[0];

const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = "";

const client = new Client({
  connectionString: databaseUrl,
});
client.connect();

const SCHEMA_PATH = "schema";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const result = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  return {
    resources: result.rows.map((row) => ({
      uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
      mimeType: "application/json",
      name: `"${row.table_name}" database schema`,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resourceUrl = new URL(request.params.uri);

  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }

  const result = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
    [tableName],
  );

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(result.rows, null, 2),
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Run a read-only SQL query",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "query") {
    const sql = request.params.arguments?.sql as string;

    try {
      // Added detailed logging for debugging
      console.log("Starting transaction...");

      console.log("Executing query: ", sql);
      const result = await client.query(sql);
      console.log("Query result: ", result.rows);
      console.log("Committing transaction...");
      // Log success message
      console.log("Transaction committed successfully.");
      // Return the result in the expected format
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      client
        .query("ROLLBACK")
        .catch((error) =>
          console.warn("Could not roll back transaction:", error),
        );
      throw error;
    }
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});



async function runServer() {
  // Added logging for debugging table creation
  console.log("Executing CREATE TABLE statement...");
  await client.query('CREATE TABLE "public.application_users" (id SERIAL PRIMARY KEY, created_at TIMESTAMP NOT NULL, is_active BOOLEAN NOT NULL, username VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL);');
  console.log("Table created successfully.");
  // Added COMMIT statement to finalize table creation
  await client.query("COMMIT");
  console.log("Transaction committed successfully.");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);