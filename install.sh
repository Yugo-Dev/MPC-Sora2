#!/bin/bash

# Sora MCP Server - Ubuntu Installation Script
# This script installs and configures the Sora MCP Server for Ubuntu

set -e

echo "=========================================="
echo "Sora MCP Server - Ubuntu Installation"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js v18 or higher first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old."
    echo "Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Determine installation directory
DEFAULT_INSTALL_DIR="$HOME/.local/share/sora-mcp-server"
read -p "Installation directory [${DEFAULT_INSTALL_DIR}]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

echo ""
echo "Installing to: $INSTALL_DIR"
echo ""

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy files
echo "📦 Copying files..."
cp -r src package.json tsconfig.json README.md EXAMPLES.md IMPROVEMENTS.md SECURITY.md "$INSTALL_DIR/"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
cd "$INSTALL_DIR"
npm install

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

# Check for OpenAI API key
echo ""
echo "=========================================="
echo "OpenAI API Key Configuration"
echo "=========================================="
echo ""

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable is not set."
    echo ""
    read -p "Enter your OpenAI API key (or press Enter to skip): " API_KEY
    if [ -n "$API_KEY" ]; then
        OPENAI_API_KEY="$API_KEY"
    fi
else
    echo "✅ OPENAI_API_KEY is already set in environment"
fi

# Create Claude Desktop config
CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "=========================================="
echo "Claude Desktop Configuration"
echo "=========================================="
echo ""

mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if config file exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "⚠️  Claude Desktop config already exists at:"
    echo "   $CLAUDE_CONFIG_FILE"
    echo ""
    read -p "Do you want to backup and update it? (y/N): " UPDATE_CONFIG
    if [[ $UPDATE_CONFIG =~ ^[Yy]$ ]]; then
        BACKUP_FILE="${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Creating backup: $BACKUP_FILE"
        cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE"
        
        # Add sora server to existing config
        echo "✏️  Updating configuration..."
        
        # Create temporary config with sora server
        cat > /tmp/sora_server.json << EOF
{
  "command": "node",
  "args": ["${INSTALL_DIR}/dist/index.js"],
  "env": {
    "USE_AZURE": "false",
    "OPENAI_API_KEY": "${OPENAI_API_KEY:-your-openai-api-key-here}"
  }
}
EOF
        
        # Use jq if available, otherwise manual merge
        if command -v jq &> /dev/null; then
            jq '.mcpServers.sora = input' "$CLAUDE_CONFIG_FILE" /tmp/sora_server.json > /tmp/claude_config_new.json
            mv /tmp/claude_config_new.json "$CLAUDE_CONFIG_FILE"
        else
            echo "⚠️  jq not found. Please manually add the sora server configuration."
            echo "   See the example configuration in: $INSTALL_DIR/claude_desktop_config_example.json"
        fi
        
        rm /tmp/sora_server.json
    fi
else
    echo "📝 Creating new Claude Desktop config..."
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "sora": {
      "command": "node",
      "args": ["${INSTALL_DIR}/dist/index.js"],
      "env": {
        "USE_AZURE": "false",
        "OPENAI_API_KEY": "${OPENAI_API_KEY:-your-openai-api-key-here}"
      }
    }
  }
}
EOF
fi

# Create example config
cat > "$INSTALL_DIR/claude_desktop_config_example.json" << EOF
{
  "mcpServers": {
    "sora": {
      "command": "node",
      "args": ["${INSTALL_DIR}/dist/index.js"],
      "env": {
        "USE_AZURE": "false",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
EOF

echo ""
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "Installation directory: $INSTALL_DIR"
echo "Config file: $CLAUDE_CONFIG_FILE"
echo ""

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key-here" ]; then
    echo "⚠️  IMPORTANT: You need to set your OpenAI API key!"
    echo ""
    echo "Edit the config file and replace 'your-openai-api-key-here' with your actual API key:"
    echo "  nano $CLAUDE_CONFIG_FILE"
    echo ""
fi

echo "Next steps:"
echo "1. Restart Claude Desktop"
echo "2. Verify the installation by asking Claude to use the Sora MCP tools"
echo ""
echo "For usage examples, see:"
echo "  $INSTALL_DIR/README.md"
echo "  $INSTALL_DIR/EXAMPLES.md"
echo ""
echo "For troubleshooting, see:"
echo "  $INSTALL_DIR/IMPROVEMENTS.md"
echo ""
