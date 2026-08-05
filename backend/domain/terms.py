"""Current versions of legal documents users must accept.

Bump these constants whenever the Terms of Use or Privacy Policy change.
Existing users are NOT retroactively re-validated by this change alone;
a future re-consent flow should compare the user's accepted version against
these constants and prompt for re-acceptance when they differ.
"""

CURRENT_TERMS_VERSION = '1.0'
CURRENT_PRIVACY_VERSION = '1.0'
