#!/bin/bash

# Exit on error
set -e

echo "🔮 Setting up Predict First with Quiz Generation Feature"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo "Please edit .env to add your Claude API key (optional)"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Final instructions
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "npm run dev"
echo ""
echo "To build for production:"
echo "npm run build"
echo "npm start"
echo ""
echo "Happy predicting! 🚀" 