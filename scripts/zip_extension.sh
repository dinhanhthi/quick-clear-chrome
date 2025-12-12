#!/bin/bash

# Ensure the build is fresh
npm run build

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="quick-clear-chrome-v${VERSION}.zip"

# Create zip file from dist directory
echo "Creating ${ZIP_NAME}..."
cd dist
zip -r "../zip/${ZIP_NAME}" .
cd ..

echo "Done! Created ${ZIP_NAME}"
