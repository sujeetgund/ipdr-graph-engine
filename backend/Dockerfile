FROM python:3.12-slim

# prevent .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Cloud Run expects port 8080 by default
ENV PORT=8080

WORKDIR /app

# Install system deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential gcc \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps from requirements.txt
COPY requirements.txt ./
RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy app code
COPY . .

# Run as non-root for better security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8080

# Use uvicorn (bind to 0.0.0.0). Cloud Run will pass PORT env var.
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
