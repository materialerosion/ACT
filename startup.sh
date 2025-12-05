#!/bin/bash

# Azure Web App startup script for Next.js
echo "Starting Next.js standalone application..."

# The PORT environment variable is automatically set by Azure App Service.
# The Next.js standalone server will automatically use it.
exec node .next/standalone/server.js
