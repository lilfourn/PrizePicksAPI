# PrizePicksAPI

> A lightweight RESTful API for retrieving PrizePicks game and player data via web scraping.

## Overview

PrizePicksAPI is built with Node.js and Express and provides endpoints to fetch game lines, player props, and more from the PrizePicks platform. It leverages Axios for HTTP requests and Cheerio for parsing and extracting relevant information.

## Architecture

- **index.js**: Entry point; initializes the server, middleware, and routes.
- **routes/prizepicks.route.js**: Defines all public API routes.
- **controllers/prizepicks.controller.js**: Contains request handlers and orchestrates data retrieval.
- **leagues/prizepicks.leagues.js**: Implements scraping logic for various sports leagues.

## Tech Stack

- **Node.js** (JavaScript runtime)
- **Express** (web framework)
- **Axios** (HTTP client)
- **Cheerio** (HTML parser)
- **dotenv** (environment variable management)
- **nodemon** (development auto-reload)

## Environment & Configuration

Environment variables (managed through a `dotenv` setup) allow customization of endpoints, timeouts, and other runtime settings without changing code.

## Development & Style

This project embraces modular design and a clear separation of concerns, making it easy to maintain and extend. Prettier is used for consistent code formatting, and comments are reserved for explaining non-obvious decisions.

## License

ISC