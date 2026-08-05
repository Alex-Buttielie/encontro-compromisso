"""Firebase Admin SDK initialization.

Supports two modes:
  - Emulator mode (dev): Set FIRESTORE_EMULATOR_HOST=localhost:8080
    No service account needed. Uses FIREBASE_PROJECT_ID for project name.
  - Production mode (homolog/prod): Set FIREBASE_CREDENTIALS to path
    of service account JSON downloaded from Firebase Console.

Environment variables:
    FIRESTORE_EMULATOR_HOST: Emulator address (dev only, e.g. localhost:8080)
    FIREBASE_CREDENTIALS: Path to service account JSON file (prod/homolog)
    FIREBASE_PROJECT_ID: Firebase project ID (used in both modes)
"""

import os
from logger import get_logger

_logger = get_logger('FirebaseConfig')

_firebase_app = None
_firestore_client = None


def _is_emulator_mode():
    """Check if we should use the Firestore emulator."""
    return bool(os.environ.get('FIRESTORE_EMULATOR_HOST'))


def init_firebase():
    """Initialize Firebase Admin SDK and return a Firestore client.

    In emulator mode (FIRESTORE_EMULATOR_HOST set), initializes with
    application defaults and points to the local emulator.

    In production mode, requires FIREBASE_CREDENTIALS pointing to a
    service account JSON file.
    """
    global _firebase_app, _firestore_client

    if _firestore_client is not None:
        return _firestore_client

    import firebase_admin
    from firebase_admin import credentials, firestore

    project_id = os.environ.get('FIREBASE_PROJECT_ID')

    if _is_emulator_mode():
        emulator_host = os.environ.get('FIRESTORE_EMULATOR_HOST')
        _logger.info('Initializing Firebase EMULATOR at %s (project=%s)',
                     emulator_host, project_id)

        # In emulator mode, use a dummy service account if no real credentials provided
        credentials_path = os.environ.get('FIREBASE_CREDENTIALS')
        if credentials_path and os.path.isfile(credentials_path):
            cred = credentials.Certificate(credentials_path)
        else:
            # Create a minimal dummy credential for emulator use
            # Uses a self-generated RSA key that won't be used for real auth
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')
            dummy_cred = {
                "type": "service_account",
                "project_id": project_id or "dev-project",
                "private_key": pem,
                "client_email": f"emulator@{project_id or 'dev-project'}.iam.gserviceaccount.com",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(dummy_cred)

        options = {
            'projectId': project_id or 'dev-project',
            'storageBucket': f'{project_id or "dev-project"}.appspot.com',
        }
        _firebase_app = firebase_admin.initialize_app(cred, options=options)

        _firestore_client = firestore.client()
        # Point to emulator
        _firestore_client._emulator_host = emulator_host
    else:
        credentials_path = os.environ.get('FIREBASE_CREDENTIALS')

        if not credentials_path or not os.path.isfile(credentials_path):
            raise RuntimeError(
                'FIREBASE_CREDENTIALS environment variable not set or file not found.\n'
                'For emulator mode, set FIRESTORE_EMULATOR_HOST=localhost:8080\n'
                'For production mode:\n'
                '1. Go to https://console.firebase.google.com/ and create/select a project\n'
                '2. Project Settings > Service Accounts > Generate New Private Key\n'
                '3. Save the JSON file to a secure location\n'
                '4. Set the environment variable:\n'
                '   set FIREBASE_CREDENTIALS=C:\\path\\to\\service-account.json\n'
            )

        _logger.info('Initializing Firebase with service account: %s', credentials_path)
        cred = credentials.Certificate(credentials_path)
        options = {}
        if project_id:
            options['projectId'] = project_id
        _firebase_app = firebase_admin.initialize_app(cred, options=options)

        _firestore_client = firestore.client()

    return _firestore_client


def get_firestore():
    """Get the singleton Firestore client instance."""
    if _firestore_client is None:
        init_firebase()
    return _firestore_client


def reset_firebase():
    """Reset Firebase state. Useful for testing."""
    global _firebase_app, _firestore_client
    if _firebase_app is not None:
        import firebase_admin
        firebase_admin.delete_app(_firebase_app)
    _firebase_app = None
    _firestore_client = None
