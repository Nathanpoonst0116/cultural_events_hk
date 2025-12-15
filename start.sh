#!/bin/bash

# Cultural Events App - Startup Script
# This script sets up and starts the Cultural Events application

echo "🎭 Cultural Events Hong Kong - Startup Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v24.9.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="24.9.0"

if ! command -v sort -V &> /dev/null; then
    echo "⚠️  Cannot verify Node.js version (sort -V not available)"
    echo "Current Node.js version: $NODE_VERSION"
else
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        echo "❌ Node.js version $NODE_VERSION is too old. Please install v24.9.0 or higher."
        exit 1
    fi
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB server 8.0.13 or higher."
    exit 1
fi

if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    
    # Try to start MongoDB (this might require sudo)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
        sleep 3
        
        if pgrep -x "mongod" > /dev/null; then
            echo "✅ MongoDB started successfully"
        else
            echo "❌ Failed to start MongoDB. Please start it manually."
            echo "   sudo systemctl start mongod"
            exit 1
        fi
    else
        echo "❌ Cannot start MongoDB automatically. Please start it manually."
        exit 1
    fi
else
    echo "✅ MongoDB is running"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Initialize database
echo "🗄️  Initializing database..."
node init-db.js
if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Failed to initialize database"
    exit 1
fi

# Import data (optional - uncomment if you want to import data on startup)
# echo "📊 Importing venue and event data..."
# node data-import.js
# if [ $? -eq 0 ]; then
#     echo "✅ Data imported successfully"
# else
#     echo "⚠️  Data import failed (you can import later through admin panel)"
# fi

echo ""
echo "🚀 Starting Cultural Events Application..."
echo "   The application will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the application
npm start