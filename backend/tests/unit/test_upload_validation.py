"""Unit tests for upload validation (BUG-07)."""
import pytest
from utils.upload_validation import validate_upload, validate_file_size, MAX_FILE_SIZE


class MockFileStorage:
    """Mock Flask FileStorage for testing."""
    def __init__(self, filename='test.jpg', mimetype='image/jpeg', content_length=1024):
        self.filename = filename
        self.mimetype = mimetype
        self.content_length = content_length


class TestValidateUpload:
    def test_valid_image_jpeg(self):
        f = MockFileStorage(filename='photo.jpg', mimetype='image/jpeg', content_length=500_000)
        assert validate_upload(f, 'image') is True

    def test_valid_image_png(self):
        f = MockFileStorage(filename='photo.png', mimetype='image/png', content_length=500_000)
        assert validate_upload(f, 'image') is True

    def test_valid_video_mp4(self):
        f = MockFileStorage(filename='video.mp4', mimetype='video/mp4', content_length=5_000_000)
        assert validate_upload(f, 'video') is True

    def test_valid_document_pdf(self):
        f = MockFileStorage(filename='doc.pdf', mimetype='application/pdf', content_length=500_000)
        assert validate_upload(f, 'document') is True

    def test_rejects_exe_file(self):
        f = MockFileStorage(filename='malware.exe', mimetype='application/octet-stream', content_length=500_000)
        with pytest.raises(ValueError, match='Tipo de arquivo não permitido'):
            validate_upload(f, 'image')

    def test_rejects_oversized_file(self):
        f = MockFileStorage(filename='big.jpg', mimetype='image/jpeg', content_length=MAX_FILE_SIZE + 1)
        with pytest.raises(ValueError, match='tamanho máximo'):
            validate_upload(f, 'image')

    def test_rejects_missing_file(self):
        with pytest.raises(ValueError, match='não fornecido'):
            validate_upload(None, 'image')

    def test_rejects_extension_mismatch(self):
        f = MockFileStorage(filename='fake.jpg', mimetype='application/pdf', content_length=500_000)
        with pytest.raises(ValueError, match='Tipo de arquivo não permitido'):
            validate_upload(f, 'image')

    def test_rejects_unknown_category(self):
        f = MockFileStorage(filename='test.jpg', mimetype='image/jpeg', content_length=500_000)
        with pytest.raises(ValueError, match='não permitido'):
            validate_upload(f, 'unknown_category')


class TestValidateFileSize:
    def test_valid_size(self):
        assert validate_file_size(500_000) is True

    def test_oversized(self):
        with pytest.raises(ValueError, match='tamanho máximo'):
            validate_file_size(MAX_FILE_SIZE + 1)

    def test_none_size_allowed(self):
        assert validate_file_size(None) is True
