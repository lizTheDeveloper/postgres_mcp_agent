# Postgres MCP Agent

## Overview
The Postgres MCP Agent is a Model Context Protocol (MCP) server designed to interact with PostgreSQL databases. It allows querying and managing database resources using the MCP framework.

## Installation

### Prerequisites
- Node.js (v16 or later)
- PostgreSQL

### Install via NPM
To install the Postgres MCP Agent via npm, run:

```bash
npm install -g postgres-mcp-agent
```

## Build from Source

### Clone the Repository
To build the Postgres MCP Agent from source, first clone the repository:

```bash
git clone https://github.com/your-repo/postgres-mcp-agent.git
cd postgres-mcp-agent
```

### Install Dependencies
Install the required dependencies:

```bash
npm install
```

### Build the Project
Build the project using TypeScript:

```bash
npm run build
```

This will compile the TypeScript files into JavaScript and generate the `dist` folder containing the compiled files.

## Usage

### Run the MCP Server
To start the MCP server, use the following command:

```bash
node dist/index.js postgres://<username>:<password>@<host>:<port>/<database>
```

Replace `<username>`, `<password>`, `<host>`, `<port>`, and `<database>` with your PostgreSQL credentials.

### Install into an MCP Client
To integrate the Postgres MCP Agent into an MCP client, add the following configuration to your MCP client settings:

```json
{
  "postgres-local": {
    "command": "node",
    "args": [
      "/path/to/postgres-mcp-agent/dist/index.js",
      "postgres://<username>:<password>@<host>:<port>/<database>"
    ]
  }
}
```

Replace `/path/to/postgres-mcp-agent/dist/index.js` with the path to the built MCP agent and `<username>`, `<password>`, `<host>`, `<port>`, and `<database>` with your PostgreSQL credentials.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any bugs or feature requests.

## License
This project is licensed under the MIT License.
