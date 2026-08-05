"""Upload validation utilities — MIME type, extension, and size checks."""
import os
from logger import get_logger

logger = get_logger('upload_validation')

ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'video': ['video/mp4', 'video/webm'],
    'document': ['application/pdf', 'image/jpeg', 'image/png'],
}

ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'webp', 'gif'},
    'video': {'mp4', 'webm'},
    'document': {'pdf', 'jpg', 'jpeg', 'png'},
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_upload(file_storage, category='image'):
    """Validate an uploaded file's MIME type, extension, and size.

    Args:
        file_storage: Flask FileStorage object with content_type, filename, content_length.
        category: One of 'image', 'video', 'document'.

    Returns:
        True if valid.

    Raises:
        ValueError: If validation fails.
    """
    if not file_storage:
        raise ValueError('Arquivo não fornecido')

    # Check size (content_length may be None if chunked)
    if file_storage.content_length and file_storage.content_length > MAX_FILE_SIZE:
        raise ValueError('Arquivo excede o tamanho máximo de 10MB')

    # Check MIME type
    mimetype = file_storage.mimetype or ''
    allowed_mimes = ALLOWED_MIME_TYPES.get(category, [])
    if mimetype not in allowed_mimes:
        raise ValueError(f'Tipo de arquivo não permitido: {mimetype}. Permitidos: {", ".join(allowed_mimes)}')

    # Check extension
    filename = file_storage.filename or ''
    ext = os.path.splitext(filename)[1].lower().lstrip('.')
    allowed_exts = ALLOWED_EXTENSIONS.get(category, set())
    if ext not in allowed_exts:
        raise ValueError(f'Extensão não permitida: .{ext}. Permitidas: {", ".join(sorted(allowed_exts))}')

    logger.debug('Upload validated: category=%s filename=%s mimetype=%s', category, filename, mimetype)
    return True


def validate_file_size(content_length):
    """Validate file size from content length header."""
    if content_length and content_length > MAX_FILE_SIZE:
        raise ValueError('Arquivo excede o tamanho máximo de 10MB')
    return True
