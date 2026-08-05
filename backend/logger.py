"""Professional logging configuration for the Flask backend."""
import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging(app_name='profissional_os'):
    """Configure professional logging to console and rotating file.

    Logs are written to backend/logs/profissional_os.log by default.
    """
    log_dir = Path(__file__).parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / f'{app_name}.log'

    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_format = (
        '%(asctime)s | %(levelname)-8s | %(name)s | '
        '[%(filename)s:%(lineno)d] %(message)s'
    )
    date_format = '%Y-%m-%d %H:%M:%S'

    formatter = logging.Formatter(log_format, datefmt=date_format)

    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = []

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Rotating file handler (max 5MB, keep 5 backups)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Flask/Werkzeug loggers
    logging.getLogger('werkzeug').setLevel(log_level)

    return root_logger


def get_logger(name):
    """Get a logger instance with the given name."""
    return logging.getLogger(name)
