FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
ENV SERVICE_PORT=8001 \
    UVICORN_WORKERS=1 \
    LOG_LEVEL=info
EXPOSE 8001
CMD ["sh", "-c", "uvicorn design_app.main:app --host 0.0.0.0 --port ${SERVICE_PORT:-8001} --workers ${UVICORN_WORKERS:-1} --log-level ${LOG_LEVEL:-info}"]
