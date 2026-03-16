FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies and build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY database/ ./database/
COPY backend/ ./backend/
RUN cd backend && npm run prisma:generate

EXPOSE 5000

ENV NODE_ENV=production

CMD ["cd", "backend", "&&", "npm", "start"]
