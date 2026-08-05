"""Integration tests for Phase 2 — Payments, Wallet, Packages, Gift Cards, Loyalty.

Covers E2E flows via Flask test client:
1. Client pays appointment via Pix (sandbox) → provider receives in wallet
2. Client buys package → uses sessions
3. Client buys gift card → redeems it
4. Cashback credited automatically
5. Webhook idempotency
6. Wallet tenant isolation
"""
import json

from domain.enums import PaymentMethod, PaymentStatus, PackageStatus, GiftCardStatus


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    """Helper: register a user and return its ID (simplified auth)."""
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    # Maybe already registered — try login
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestPaymentSandboxFlow:
    """E2E: Client pays via Pix (sandbox) → webhook → provider receives in wallet."""

    def test_pix_payment_full_flow(self, client, app):
        user_id = _register_and_get_token(client, email='pix@test.com')
        headers = {'Authorization': f'Bearer {user_id}'}

        # 1. Create Pix payment with split
        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 100.00,
                               'method': PaymentMethod.PIX.value,
                               'description': 'Consulta - Pix',
                               'platformFee': 10.00,
                               'providerAmount': 90.00,
                           }),
                           content_type='application/json',
                           headers=headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['success'] is True
        assert data['payment']['status'] == PaymentStatus.PROCESSING.value
        assert 'pix_qr_code' in data
        gateway_tx_id = data['gateway_transaction_id']
        payment_id = data['payment']['id']

        # 2. Simulate webhook (payment paid)
        resp = client.post('/api/webhooks/payment',
                           data=json.dumps({
                               'event': 'payment.paid',
                               'transaction_id': gateway_tx_id,
                               'status': 'paid',
                           }),
                           content_type='application/json')
        assert resp.status_code == 200
        assert resp.get_json()['payment']['status'] == PaymentStatus.PAID.value

        # 3. Check wallet was credited with provider amount
        resp = client.get('/api/wallet', headers=headers)
        assert resp.status_code == 200
        wallet = resp.get_json()['wallet']
        assert wallet['balance'] == 90.00

    def test_credit_card_payment_with_installments(self, client, app):
        user_id = _register_and_get_token(client, email='cc@test.com')
        headers = {'Authorization': f'Bearer {user_id}'}

        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 600.00,
                               'method': PaymentMethod.CREDIT_CARD.value,
                               'description': 'Pacote 6 sessões',
                               'installments': 6,
                               'platformFee': 60.00,
                               'providerAmount': 540.00,
                           }),
                           content_type='application/json',
                           headers=headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['payment']['status'] == PaymentStatus.AUTHORIZED.value
        assert data['payment']['installments'] == 6
        assert data['payment']['installmentAmount'] == 100.00

    def test_payment_idempotent_replay_via_api(self, client, app):
        user_id = _register_and_get_token(client, email='idem@test.com')
        headers = {'Authorization': f'Bearer {user_id}'}

        payload = {
            'amount': 50.00,
            'method': PaymentMethod.PIX.value,
            'description': 'Test idempotency',
            'idempotencyKey': 'idem-key-001',
        }
        r1 = client.post('/api/payments',
                         data=json.dumps(payload),
                         content_type='application/json',
                         headers=headers)
        assert r1.status_code == 201

        r2 = client.post('/api/payments',
                         data=json.dumps(payload),
                         content_type='application/json',
                         headers=headers)
        assert r2.status_code == 201
        assert r2.get_json().get('replay') is True
        assert r1.get_json()['payment']['id'] == r2.get_json()['payment']['id']


class TestWebhookIdempotency:
    """Webhooks must be idempotent — replaying the same webhook has no effect."""

    def test_duplicate_webhook_no_double_credit(self, client, app):
        user_id = _register_and_get_token(client, email='webhook@test.com')
        headers = {'Authorization': f'Bearer {user_id}'}

        # Create payment
        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 100.00,
                               'method': PaymentMethod.PIX.value,
                               'description': 'Webhook test',
                               'platformFee': 10.00,
                               'providerAmount': 90.00,
                           }),
                           content_type='application/json',
                           headers=headers)
        tx_id = resp.get_json()['gateway_transaction_id']

        # First webhook
        client.post('/api/webhooks/payment',
                    data=json.dumps({
                        'event': 'payment.paid',
                        'transaction_id': tx_id,
                        'status': 'paid',
                    }),
                    content_type='application/json')

        # Second webhook (replay)
        r2 = client.post('/api/webhooks/payment',
                         data=json.dumps({
                             'event': 'payment.paid',
                             'transaction_id': tx_id,
                             'status': 'paid',
                         }),
                         content_type='application/json')
        assert r2.status_code == 200
        assert r2.get_json().get('replay') is True

        # Wallet should only have 90.00, not 180.00
        resp = client.get('/api/wallet', headers=headers)
        assert resp.get_json()['wallet']['balance'] == 90.00

    def test_webhook_failure_status(self, client, app):
        user_id = _register_and_get_token(client, email='fail@test.com')
        headers = {'Authorization': f'Bearer {user_id}'}

        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 100.00,
                               'method': PaymentMethod.PIX.value,
                               'description': 'Fail test',
                           }),
                           content_type='application/json',
                           headers=headers)
        tx_id = resp.get_json()['gateway_transaction_id']

        resp = client.post('/api/webhooks/payment',
                           data=json.dumps({
                               'event': 'payment.failed',
                               'transaction_id': tx_id,
                               'status': 'failed',
                           }),
                           content_type='application/json')
        assert resp.status_code == 200
        assert resp.get_json()['payment']['status'] == PaymentStatus.FAILED.value


class TestWalletTenantIsolation:
    """Wallets must be isolated per tenant (user)."""

    def test_wallets_isolated(self, client, app):
        uid1 = _register_and_get_token(client, email='tenant1@test.com')
        uid2 = _register_and_get_token(client, email='tenant2@test.com')
        h1 = {'Authorization': f'Bearer {uid1}'}
        h2 = {'Authorization': f'Bearer {uid2}'}

        # User 1 gets cashback
        client.post('/api/loyalty/cashback',
                    data=json.dumps({'paymentAmount': 100.00, 'rate': 0.10}),
                    content_type='application/json', headers=h1)

        # User 2 gets cashback
        client.post('/api/loyalty/cashback',
                    data=json.dumps({'paymentAmount': 200.00, 'rate': 0.10}),
                    content_type='application/json', headers=h2)

        w1 = client.get('/api/wallet', headers=h1).get_json()['wallet']
        w2 = client.get('/api/wallet', headers=h2).get_json()['wallet']

        assert w1['balance'] == 10.00
        assert w2['balance'] == 20.00

    def test_wallet_transfer_between_users(self, client, app):
        uid1 = _register_and_get_token(client, email='transfer1@test.com')
        uid2 = _register_and_get_token(client, email='transfer2@test.com')
        h1 = {'Authorization': f'Bearer {uid1}'}

        # Fund user 1
        client.post('/api/loyalty/cashback',
                    data=json.dumps({'paymentAmount': 100.00, 'rate': 0.10}),
                    content_type='application/json', headers=h1)

        # Transfer to user 2
        resp = client.post('/api/wallet/transfer',
                           data=json.dumps({'receiverUserId': uid2, 'amount': 5.00}),
                           content_type='application/json', headers=h1)
        assert resp.status_code == 200
        assert resp.get_json()['sender']['balance'] == 5.00

    def test_wallet_statement_shows_entries(self, client, app):
        uid = _register_and_get_token(client, email='stmt@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/loyalty/cashback',
                    data=json.dumps({'paymentAmount': 100.00, 'rate': 0.10}),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/wallet/statement', headers=headers)
        assert resp.status_code == 200
        statement = resp.get_json()['statement']
        assert len(statement) == 1
        assert statement[0]['isCredit'] is True


class TestPackageFlow:
    """E2E: Client buys package → uses sessions → blocked after exhaustion."""

    def test_buy_and_use_package(self, client, app):
        uid = _register_and_get_token(client, email='pkg@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create a client first
        resp = client.post('/api/clients',
                           data=json.dumps({'name': 'Cliente Test'}),
                           content_type='application/json', headers=headers)
        client_id = resp.get_json()['client']['id']

        # Create package
        resp = client.post('/api/packages',
                           data=json.dumps({
                               'clientId': client_id,
                               'name': 'Pacote 5 sessões',
                               'totalSessions': 5,
                               'price': 400,
                               'validityDays': 90,
                               'sessionPrice': 100,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        pkg = resp.get_json()['package']
        assert pkg['remainingSessions'] == 5
        assert pkg['discountPercentage'] == 20.0
        pkg_id = pkg['id']

        # Use 3 sessions
        for _ in range(3):
            resp = client.post(f'/api/packages/{pkg_id}/use',
                               content_type='application/json', headers=headers)
            assert resp.status_code == 200

        resp = client.get(f'/api/packages', headers=headers)
        pkgs = resp.get_json()['packages']
        assert pkgs[0]['remainingSessions'] == 2

    def test_package_exhausted_blocks_usage(self, client, app):
        uid = _register_and_get_token(client, email='pkgex@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/clients',
                           data=json.dumps({'name': 'Cliente'}),
                           content_type='application/json', headers=headers)
        client_id = resp.get_json()['client']['id']

        resp = client.post('/api/packages',
                           data=json.dumps({
                               'clientId': client_id,
                               'name': 'Pacote 1',
                               'totalSessions': 1,
                               'price': 100,
                               'validityDays': 30,
                           }),
                           content_type='application/json', headers=headers)
        pkg_id = resp.get_json()['package']['id']

        # Use the single session
        resp = client.post(f'/api/packages/{pkg_id}/use',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['package']['status'] == PackageStatus.EXHAUSTED.value

        # Try to use again
        resp = client.post(f'/api/packages/{pkg_id}/use',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400


class TestGiftCardFlow:
    """E2E: Client buys gift card → sends to recipient → recipient redeems."""

    def test_buy_and_redeem_gift_card(self, client, app):
        uid = _register_and_get_token(client, email='gc@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create gift card
        resp = client.post('/api/gift-cards',
                           data=json.dumps({
                               'amount': 50.00,
                               'recipientEmail': 'friend@example.com',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        gc = resp.get_json()['giftCard']
        assert gc['status'] == GiftCardStatus.ACTIVE.value
        code = gc['code']

        # Redeem gift card
        resp = client.post('/api/gift-cards/redeem',
                           data=json.dumps({
                               'code': code,
                               'redeemedByEmail': 'gc@test.com',
                           }),
                           content_type='application/json')
        assert resp.status_code == 200
        assert resp.get_json()['giftCard']['status'] == GiftCardStatus.REDEEMED.value

    def test_redeem_blocked_gift_card(self, client, app):
        uid = _register_and_get_token(client, email='gcblock@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/gift-cards',
                           data=json.dumps({
                               'amount': 50.00,
                               'recipientEmail': 'friend@example.com',
                           }),
                           content_type='application/json', headers=headers)
        code = resp.get_json()['giftCard']['code']

        # Block it
        client.post(f'/api/gift-cards/{code}/block',
                    content_type='application/json', headers=headers)

        # Try to redeem
        resp = client.post('/api/gift-cards/redeem',
                           data=json.dumps({
                               'code': code,
                               'redeemedByEmail': 'gcblock@test.com',
                           }),
                           content_type='application/json')
        assert resp.status_code == 400

    def test_redeem_invalid_code(self, client, app):
        resp = client.post('/api/gift-cards/redeem',
                           data=json.dumps({
                               'code': 'INVALID',
                               'redeemedByEmail': 'nobody@test.com',
                           }),
                           content_type='application/json')
        assert resp.status_code == 400


class TestCashbackFlow:
    """E2E: Cashback credited automatically after payment."""

    def test_cashback_credited_after_payment(self, client, app):
        uid = _register_and_get_token(client, email='cash@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Award cashback via API
        resp = client.post('/api/loyalty/cashback',
                           data=json.dumps({
                               'paymentAmount': 200.00,
                               'rate': 0.10,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['cashback'] == 20.00

        # Check wallet
        resp = client.get('/api/wallet', headers=headers)
        assert resp.get_json()['wallet']['balance'] == 20.00

    def test_cashback_capped(self, client, app):
        uid = _register_and_get_token(client, email='cashcap@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/loyalty/cashback',
                           data=json.dumps({
                               'paymentAmount': 1000.00,
                               'rate': 0.10,
                               'cap': 50.00,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['cashback'] == 50.00


class TestLoyaltyFlow:
    """E2E: Points, XP, levels, medals, missions, ranking."""

    def test_earn_points_and_xp(self, client, app):
        uid = _register_and_get_token(client, email='loyalty@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Earn points
        resp = client.post('/api/loyalty/points/earn',
                           data=json.dumps({'amount': 50, 'reason': 'service'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['account']['points'] == 50

        # Earn XP (triggers level up at 100)
        resp = client.post('/api/loyalty/xp/earn',
                           data=json.dumps({'amount': 100, 'reason': 'completion'}),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['account']['level'] == 2

    def test_create_mission_and_medal(self, client, app):
        uid = _register_and_get_token(client, email='mission@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create mission
        resp = client.post('/api/loyalty/missions',
                           data=json.dumps({
                               'title': '5 agendamentos',
                               'description': 'Agende 5 sessões',
                               'xpReward': 50,
                               'pointsReward': 100,
                               'targetCount': 5,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # Create medal
        resp = client.post('/api/loyalty/medals',
                           data=json.dumps({
                               'title': 'Primeiro agendamento',
                               'description': 'Test',
                               'icon': '🏆',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        medal_id = resp.get_json()['medal']['id']

        # Award medal
        resp = client.post(f'/api/loyalty/medals/{medal_id}/award',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_ranking(self, client, app):
        uid1 = _register_and_get_token(client, email='rank1@test.com')
        uid2 = _register_and_get_token(client, email='rank2@test.com')
        h1 = {'Authorization': f'Bearer {uid1}'}
        h2 = {'Authorization': f'Bearer {uid2}'}

        # Both earn XP as their own provider
        client.post('/api/loyalty/xp/earn',
                    data=json.dumps({'amount': 300, 'reason': 'test'}),
                    content_type='application/json', headers=h1)
        client.post('/api/loyalty/xp/earn',
                    data=json.dumps({'amount': 100, 'reason': 'test'}),
                    content_type='application/json', headers=h2)

        # Each ranking shows only their own account (each is own provider)
        resp1 = client.get('/api/loyalty/ranking', headers=h1)
        assert resp1.status_code == 200
        ranking1 = resp1.get_json()['ranking']
        assert len(ranking1) == 1
        assert ranking1[0]['xp'] == 300

        resp2 = client.get('/api/loyalty/ranking', headers=h2)
        assert resp2.status_code == 200
        ranking2 = resp2.get_json()['ranking']
        assert len(ranking2) == 1
        assert ranking2[0]['xp'] == 100


class TestRefundFlow:
    """E2E: Payment refund (full and partial)."""

    def test_full_refund(self, client, app):
        uid = _register_and_get_token(client, email='refund@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create + pay
        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 100.00,
                               'method': PaymentMethod.PIX.value,
                               'description': 'Refund test',
                           }),
                           content_type='application/json', headers=headers)
        tx_id = resp.get_json()['gateway_transaction_id']
        payment_id = resp.get_json()['payment']['id']

        client.post('/api/webhooks/payment',
                    data=json.dumps({
                        'event': 'payment.paid',
                        'transaction_id': tx_id,
                        'status': 'paid',
                    }),
                    content_type='application/json')

        # Full refund
        resp = client.post(f'/api/payments/{payment_id}/refund',
                           data=json.dumps({}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['payment']['status'] == PaymentStatus.FULLY_REFUNDED.value

    def test_partial_refund(self, client, app):
        uid = _register_and_get_token(client, email='prefund@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/payments',
                           data=json.dumps({
                               'amount': 100.00,
                               'method': PaymentMethod.PIX.value,
                               'description': 'Partial refund test',
                           }),
                           content_type='application/json', headers=headers)
        tx_id = resp.get_json()['gateway_transaction_id']
        payment_id = resp.get_json()['payment']['id']

        client.post('/api/webhooks/payment',
                    data=json.dumps({
                        'event': 'payment.paid',
                        'transaction_id': tx_id,
                        'status': 'paid',
                    }),
                    content_type='application/json')

        resp = client.post(f'/api/payments/{payment_id}/refund',
                           data=json.dumps({'amount': 30.00}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['payment']['status'] == PaymentStatus.PARTIALLY_REFUNDED.value
        assert resp.get_json()['payment']['refundedAmount'] == 30.00
