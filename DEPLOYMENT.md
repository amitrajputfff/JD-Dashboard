# LiaPlus Dashboard Deployment Guide

This guide will help you deploy the LiaPlus Dashboard with HTTPS using nginx and Let's Encrypt SSL certificates.

## Prerequisites

- Docker and Docker Compose installed on your server
- Domain name pointing to your server (app.liaplus.com)
- Ports 80 and 443 open on your server
- Root or sudo access to your server

## Quick Deployment

### 1. Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd Dashboard-V2

# Make deployment script executable
chmod +x deploy.sh
```

### 2. Update Configuration

Before running the deployment, update the following files:

**In `deploy.sh`:**
- Replace `your-email@example.com` with your actual email address

**In `docker-compose.yml`:**
- Update the email address in the certbot service

### 3. Run Deployment

```bash
./deploy.sh
```

This script will:
- Build and start your application
- Obtain SSL certificates from Let's Encrypt
- Configure automatic certificate renewal
- Set up nginx as a reverse proxy

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### Step 1: Build and Start Application

```bash
# Create necessary directories
mkdir -p ssl logs/nginx logs/certbot

# Build and start the application
docker compose up -d --build app
```

### Step 2: Obtain SSL Certificate

```bash
# Stop the application temporarily to free port 80
docker compose stop app

# Run certbot to get SSL certificate
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
```

### Step 3: Start Application with SSL

```bash
# Start the application with SSL
docker compose up -d app
```

### Step 4: Set Up Automatic Renewal

```bash
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
```

## SSL Certificate Management

### Manual Renewal

```bash
./renew-ssl.sh
```

### Check Certificate Status

```bash
# Check certificate expiration
docker run --rm \
    -v $(pwd)/ssl:/etc/letsencrypt \
    certbot/certbot certificates
```

### Force Renewal

```bash
docker run --rm \
    -v $(pwd)/ssl:/etc/letsencrypt \
    -v $(pwd)/logs/certbot:/var/log/letsencrypt \
    -p 80:80 \
    certbot/certbot renew --force-renewal
```

## Useful Commands

### View Logs

```bash
# Application logs
docker compose logs -f app

# Nginx access logs
tail -f logs/nginx/access.log

# Nginx error logs
tail -f logs/nginx/error.log

# Certbot logs
tail -f logs/certbot/letsencrypt.log
```

### Service Management

```bash
# Stop all services
docker compose down

# Restart services
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### Nginx Management

```bash
# Reload nginx configuration
docker compose exec app nginx -s reload

# Test nginx configuration
docker compose exec app nginx -t

# View nginx status
docker compose exec app nginx -s status
```

## Troubleshooting

### SSL Certificate Issues

1. **Certificate not found**: Ensure the domain points to your server and port 80 is accessible
2. **Certificate expired**: Run `./renew-ssl.sh` to renew manually
3. **Rate limit exceeded**: Wait 1 hour before trying again

### Nginx Issues

1. **Configuration errors**: Check nginx logs in `logs/nginx/error.log`
2. **Permission issues**: Ensure SSL certificate files are readable by nginx
3. **Port conflicts**: Ensure ports 80 and 443 are not used by other services

### Application Issues

1. **Build failures**: Check Docker build logs
2. **Runtime errors**: Check application logs with `docker compose logs app`
3. **Environment variables**: Ensure all required environment variables are set

## Security Considerations

- The nginx configuration includes security headers and rate limiting
- SSL certificates are automatically renewed
- HSTS is enabled for additional security
- Rate limiting is configured for API and auth endpoints

## Monitoring

Consider setting up monitoring for:
- SSL certificate expiration
- Application health checks
- Nginx access and error logs
- Docker container status

## Backup

Regularly backup:
- SSL certificates: `ssl/` directory
- Application logs: `logs/` directory
- Environment configuration files
- Docker volumes if using persistent data
