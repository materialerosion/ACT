#!/bin/bash

# Azure Web App startup script for Next.js
# This script ensures dependencies are installed before starting the app

echo "Starting deployment process..."

# Install production dependencies
echo "Installing dependencies..."
npm ci --omit=dev

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Start the Next.js server
echo "Starting Next.js server..."
npm start
