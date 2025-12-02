#!/bin/bash

# Azure Web App startup script for Next.js
# Build is already done in GitHub Actions, so we only need to install production dependencies and start

echo "Starting deployment process..."

# Install production dependencies only (build artifacts already exist)
echo "Installing production dependencies..."
npm ci --omit=dev

# Start the Next.js server
echo "Starting Next.js server..."
npm start
