#!/bin/bash

# Azure Web App startup script for Next.js
echo "Starting Next.js application..."

# Set PORT if not already set
export PORT=${PORT:-8080}

# Ensure we're in the correct directory
cd /home/site/wwwroot

# Start the Next.js server
npm start
