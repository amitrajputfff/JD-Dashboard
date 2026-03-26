#!/bin/bash

# Deployment script for LiaPlus Dashboard with SSL
set -e

echo "🚀 Starting LiaPlus Dashboard deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ssl logs/nginx logs/certbot

# Step 1: Build and start the application without SSL first
print_status "Building and starting the application..."
docker compose up -d --build app

# Wait for the application to be ready
print_status "Waiting for application to be ready..."
sleep 10

# Step 2: Get SSL certificate using certbot
print_status "Setting up SSL certificate with certbot..."

# Stop nginx temporarily to free up port 80
docker compose stop app

# Run certbot to get the certificate
print_status "Running certbot to obtain SSL certificate..."
docker run --rm \
    -v $(pwd)/ssl:/etc/letsencrypt \
    -v $(pwd)/logs/certbot:/var/log/letsencrypt \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d app.liaplus.com

# Step 3: Start the application with SSL
print_status "Starting application with SSL..."
docker compose up -d app

# Step 4: Set up automatic certificate renewal
print_status "Setting up automatic certificate renewal..."

# Create renewal script
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
docker run --rm \
    -v $(pwd)/ssl:/etc/letsencrypt \
    -v $(pwd)/logs/certbot:/var/log/letsencrypt \
    -p 80:80 \
    certbot/certbot renew

# Reload nginx to pick up new certificates
docker compose exec app nginx -s reload
EOF

chmod +x renew-ssl.sh

# Add cron job for automatic renewal (runs twice daily)
(crontab -l 2>/dev/null; echo "0 0,12 * * * $(pwd)/renew-ssl.sh") | crontab -

print_status "✅ Deployment completed successfully!"
print_status "Your application is now running at: https://app.liaplus.com"
print_status "SSL certificate will be automatically renewed twice daily"

# Display useful commands
echo ""
print_status "Useful commands:"
echo "  View logs: docker compose logs -f app"
echo "  Stop services: docker compose down"
echo "  Restart services: docker compose restart"
echo "  Renew SSL manually: ./renew-ssl.sh"
echo "  View nginx logs: tail -f logs/nginx/access.log"
echo "  View nginx error logs: tail -f logs/nginx/error.log"
