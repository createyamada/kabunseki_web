#!/bin/bash

# Always run from the directory containing this file.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required."
  echo "Install the LTS version from https://nodejs.org/ and try again."
  read -r -p "Press Enter to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci
  if [ $? -ne 0 ]; then
    echo "Dependency installation failed."
    read -r -p "Press Enter to close..."
    exit 1
  fi
fi

echo "Starting Kabunseki Web..."
echo "The app will open at http://localhost:3000"
echo "Press Ctrl+C to stop it."
npm start

if [ $? -ne 0 ]; then
  echo "The application stopped with an error."
  read -r -p "Press Enter to close..."
fi
