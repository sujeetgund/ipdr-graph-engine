# Development Guide

This guide provides instructions and best practices for developing and contributing to the IPDR Graph Engine project.

## Getting Started
- Clone the repository and set up the backend and frontend as described in the README.
- Use feature branches for new work.
- Follow code style guidelines and write clear, concise commit messages.

## Code Structure
- **backend/**: FastAPI backend, ML models, data parsing
- **frontend/**: Next.js frontend, graph visualization
- **Anomoly/**: Notebooks, model artifacts
- **notebooks/**: Research and prototyping
- **scripts/**: Deployment and utility scripts

## Best Practices
- Write modular, reusable code.
- Add docstrings and comments for clarity.
- Test your code before submitting a PR.
- Keep dependencies up to date.

## Useful Commands
- Backend: `uvicorn app.main:app --reload`
- Frontend: `npm run dev`

For more details, see the README and other guides in the docs/ folder.
