# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /src
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app

# Install Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /src/dist/ ./frontend/dist/

# Create data directories
RUN mkdir -p uploads

EXPOSE 8765
CMD ["python", "run.py"]
