#!/bin/bash

# Azure Web App startup script for Next.js
# All dependencies and build artifacts are included in deployment

echo "Starting Next.js application..."

# Start the Next.js server (PORT is automatically set by Azure)
npm start
