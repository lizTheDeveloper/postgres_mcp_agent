"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const papersDirectory = process.env.PAPERS_DIRECTORY || '/Users/annhoward/Downloads/Papers';
/**
 * Search for a string in text files and PDFs within the papers directory.
 * @param {string} searchString - The string to search for.
 * @returns {Promise<string[]>} - List of file names containing the search string.
 */
const searchPapers = async (searchString) => {
    const files = fs_1.default.readdirSync(papersDirectory);
    const matchingFiles = [];
    for (const file of files) {
        const filePath = path_1.default.join(papersDirectory, file);
        const fileExtension = path_1.default.extname(file).toLowerCase();
        try {
            if (fileExtension === '.txt') {
                const content = fs_1.default.readFileSync(filePath, 'utf-8');
                if (content.includes(searchString)) {
                    matchingFiles.push(file);
                }
            }
            else if (fileExtension === '.pdf') {
                const dataBuffer = fs_1.default.readFileSync(filePath);
                const pdfData = await (0, pdf_parse_1.default)(dataBuffer);
                if (pdfData.text.includes(searchString)) {
                    matchingFiles.push(file);
                }
            }
        }
        catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }
    return matchingFiles;
};
// Initialize MCP server
const server = new index_js_1.Server({
    name: 'Paper Searcher MCP Server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Set request handler for calling tools
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
    }
    catch (error) {
    }
})();
