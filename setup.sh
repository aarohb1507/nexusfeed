#!/bin/bash

# NexusFeed Complete Setup Script
# This script installs all dependencies for the entire platform

set -e

echo "🚀 NexusFeed Complete Setup"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Function to install dependencies for a service
install_service() {
    SERVICE=$1
    echo "📦 Installing dependencies for $SERVICE..."
    cd "$SERVICE"
    npm install
    cd ..
    echo "✅ $SERVICE dependencies installed"
    echo ""
}

# Install backend services
echo "🔧 Installing Backend Services..."
echo "===================================="
install_service "api-gateway"
install_service "identity-service"
install_service "post-service"
install_service "media-service"
install_service "search-service"

# Install UI
echo "🎨 Installing UI..."
echo "==================="
install_service "ui"

echo "✨ All dependencies installed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Configure environment variables in each service's .env file"
echo "2. Start infrastructure: MongoDB, Redis, RabbitMQ"
echo "3. Option A - Run with Docker:"
echo "   docker-compose up --build"
echo ""
echo "4. Option B - Run locally (6 terminals):"
echo "   Terminal 1: cd api-gateway && npm start"
echo "   Terminal 2: cd identity-service && npm start"
echo "   Terminal 3: cd post-service && npm start"
echo "   Terminal 4: cd media-service && npm start"
echo "   Terminal 5: cd search-service && npm start"
echo "   Terminal 6: cd ui && npm run dev"
echo ""
echo "5. Access the application:"
echo "   UI: http://localhost:3005"
echo "   API Gateway: http://localhost:3000"
echo ""
echo "🎉 Happy coding!"
