import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const papersDirectory = process.env.PAPERS_DIRECTORY || '/Users/annhoward/Downloads/Papers';

/**
 * Search for a string in text files and PDFs within the papers directory.
 * @param {string} searchString - The string to search for.
 * @returns {Promise<string[]>} - List of file names containing the search string.
 */
const searchPapers = async (searchString: string): Promise<string[]> => {
  const files = fs.readdirSync(papersDirectory);
  const matchingFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(papersDirectory, file);
    const fileExtension = path.extname(file).toLowerCase();

    try {
      if (fileExtension === '.txt') {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes(searchString)) {
          matchingFiles.push(file);
        }
      } else if (fileExtension === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        if (pdfData.text.includes(searchString)) {
          matchingFiles.push(file);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  return matchingFiles;
};

// Initialize MCP server
const server = new Server(
  {
    name: 'Paper Searcher MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set request handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: { searchString?: string } } }) => {
  if (request.params.name === "searchPapers") {
    const searchString = request.params.arguments?.searchString || "";
    const results = await searchPapers(searchString);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }],
      isError: false,
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Set request handler for listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "searchPapers",
        description: "Search for a string in text files and PDFs within the papers directory.",
        inputSchema: {
          type: "object",
          properties: {
            searchString: { type: "string" },
          },
        },
      },
    ],
  };
});

// Connect MCP server to transport

(async () => {
  try {
    
    const transport = new StdioServerTransport();
    await server.connect(transport);

  } catch (error) {

  }
})();
