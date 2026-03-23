.PHONY: dev stop backend frontend install logs clean

# Start infrastructure services with Docker Compose
dev:
	docker compose up -d mongodb minio mongo-express
	@echo "✅ MongoDB running at localhost:27017"
	@echo "✅ Mongo Express at http://localhost:8081"
	@echo "✅ MinIO at http://localhost:9001 (minioadmin/minioadmin)"

# Start just the backend locally (without Docker)
backend:
	cd backend && python3 -m uvicorn app.main:app --reload --port 8000

# Start just the frontend locally (without Docker)
frontend:
	cd frontend && npm run dev

# Install backend dependencies
install-backend:
	cd backend && pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Install all
install: install-backend install-frontend

# Stop all Docker services
stop:
	docker compose down

# View backend logs
logs:
	docker compose logs -f backend

# Full Docker Compose up (all services)
up:
	docker compose up -d

# Clean up Docker volumes (WARNING: deletes data)
clean:
	docker compose down -v

# Run backend + infrastructure (MongoDB + MinIO) together
run:
	docker compose up -d mongodb minio mongo-express
	cd backend && python3 -m uvicorn app.main:app --reload --port 8000
