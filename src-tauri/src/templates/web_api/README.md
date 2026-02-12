# FastAPI Web API

A REST API application built with FastAPI.

## Features

- RESTful API endpoints
- Automatic API documentation (Swagger UI)
- Request/response validation with Pydantic
- CRUD operations for items

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Run the server:
   ```bash
   uv run python main.py
   ```

3. Open your browser and visit:
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /items` - Get all items
- `GET /items/{id}` - Get item by ID
- `POST /items` - Create new item
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item
