# Deployment Guide

This guide describes how to deploy the IPDR Graph Engine project.

## Local Deployment
- Follow the setup instructions in the README for backend and frontend.
- Use Docker Compose for multi-service local deployment:
  ```bash
  docker-compose up -d
  ```

## Production Deployment
- **Frontend:** Deploy to Vercel or your preferred static hosting.
- **Backend:** Deploy to Render, Heroku, or your own server.
- Set environment variables for production in `.env` files.
- Use HTTPS and secure credentials.

## Environment Variables
- Store secrets and API keys in `.env` files (not in source control).
- Example variables:
  - `MONGODB_URI`
  - `SECRET_KEY`
  - `API_BASE_URL`

## Monitoring & Maintenance
- Monitor logs and performance.
- Regularly update dependencies and security patches.

For more details, see the README and other guides in the docs/ folder.
