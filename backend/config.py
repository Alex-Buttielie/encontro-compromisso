"""Backend configuration."""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_EXPIRATION = timedelta(hours=24)
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            'CORS_ORIGINS',
            'http://localhost:3000,http://127.0.0.1:3000'
        ).split(',')
        if origin.strip()
    ]
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')

    # Enforce SECRET_KEY in production
    if not DEBUG and SECRET_KEY == 'dev-secret-key-change-in-production':
        raise RuntimeError('SECRET_KEY must be set via environment variable in production')
