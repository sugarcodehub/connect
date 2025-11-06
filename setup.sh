#!/bin/bash

# Video Chat App Setup Script
# Run this on your Ubuntu VPS

set -e

echo "🚀 Video Chat App Setup"
echo "======================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

echo -e "${YELLOW}[1/6] Installing Docker...${NC}"
# Install Docker
if ! command -v docker &> /dev/null; then
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo -e "${YELLOW}[2/6] Configuring firewall...${NC}"
# Configure UFW
ufw --force enable
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 7880/tcp
ufw allow 50000:50100/udp
echo -e "${GREEN}✓ Firewall configured${NC}"

echo -e "${YELLOW}[3/6] Getting server IP...${NC}"
SERVER_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}✓ Server IP: $SERVER_IP${NC}"

echo -e "${YELLOW}[4/6] Updating LiveKit configuration...${NC}"
# Update livekit-config.yaml with server IP if not already set
if ! grep -q "external_ip:" livekit-config.yaml; then
    sed -i "/use_external_ip: true/a \ \ external_ip: \"$SERVER_IP\"" livekit-config.yaml
    echo -e "${GREEN}✓ LiveKit config updated with IP: $SERVER_IP${NC}"
else
    echo -e "${GREEN}✓ LiveKit config already has external_ip${NC}"
fi

echo -e "${YELLOW}[5/6] Creating necessary directories...${NC}"
mkdir -p recordings
chmod 777 recordings
echo -e "${GREEN}✓ Directories created${NC}"

echo -e "${YELLOW}[6/6] Starting services...${NC}"
docker compose up -d --build

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🌐 Access your app at:"
echo "   http://$SERVER_IP:8080"
echo ""
echo "📝 Next steps:"
echo "   1. Test the application"
echo "   2. For production, set up a domain and SSL certificate"
echo "   3. Change default passwords in docker-compose.yml"
echo "   4. Update JWT_SECRET in docker-compose.yml"
echo ""
echo "📊 Check status:"
echo "   docker compose ps"
echo "   docker compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""