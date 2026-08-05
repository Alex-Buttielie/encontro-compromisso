"""Email sending abstraction.

Provides a mock/console adapter for development. No real e-mail provider is
implemented yet. Before enabling real delivery in production, configure a
provider (e.g. SMTP, SendGrid, Amazon SES) and implement its adapter here.

Required environment variables once a real provider is configured:

- EMAIL_PROVIDER: name of the provider adapter to use (e.g. "smtp").
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD: SMTP credentials.
- EMAIL_FROM: sender address shown to recipients.

Until then, `EMAIL_PROVIDER` defaults to "console" and e-mails are only
logged, never actually sent.
"""
import os

from logger import get_logger


class ConsoleEmailSender:
    """Development adapter: logs the e-mail instead of sending it."""

    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)

    def send(self, to, subject, body):
        self.logger.info('MOCK EMAIL | to=%s | subject=%s | body=%s', to, subject, body)
        return True


def get_email_sender():
    """Return the configured email sender adapter.

    Falls back to the console/mock sender when no real provider is
    configured via the EMAIL_PROVIDER environment variable.
    """
    provider = os.environ.get('EMAIL_PROVIDER', 'console')
    if provider == 'console':
        return ConsoleEmailSender()
    raise NotImplementedError(
        f'Provedor de e-mail "{provider}" não está implementado. '
        'Implemente o adaptador correspondente antes de usá-lo em produção.'
    )
