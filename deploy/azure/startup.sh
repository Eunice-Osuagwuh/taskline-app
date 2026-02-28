#!/usr/bin/env sh
set -eu

# If build output is missing (common on first deploy), build it at startup.
if [ ! -d "dist" ]; then
  npm run build
fi

# Start the Node server on Azure's injected PORT.
exec node server.js
