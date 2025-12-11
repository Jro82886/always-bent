FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8010

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the app directory
COPY app/ /app/app/

EXPOSE 8010

# Use shell form to allow environment variable expansion
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT


