"""Integration + E2E tests for Phase 7 — Subscriptions, Referrals, AI Agents.

E2E flows:
1. Cliente assina plano mensal.
2. Cobrança recorrente processada (sandbox).
3. Cliente indica amigo com link personalizado.
4. Amigo se cadastra e converte indicação.
5. Prestador ativa Agente Financeiro.
6. Agente sugere precificação baseada em histórico.
7. Prestador revisa e aprova sugestão.
8. Sistema registra recomendação em auditoria.
"""
import json

from domain.enums import (
    SubscriptionStatus, BillingStatus, ReferralStatus,
    AgentType, AgentStatus, AgentActionStatus,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
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
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestSubscriptionE2E:
    """E2E: Create subscription → process billing → retry on failure."""

    def test_create_subscription(self, client, app):
        uid = _register_and_get_token(client, email='sub1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                               'interval': 'monthly',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        sub = resp.get_json()['subscription']
        assert sub['status'] == SubscriptionStatus.ACTIVE.value
        assert sub['autoRenew'] is True

    def test_create_trial_subscription(self, client, app):
        uid = _register_and_get_token(client, email='sub2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                               'trialDays': 14,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['subscription']['status'] == SubscriptionStatus.TRIALING.value

    def test_process_billing(self, client, app):
        uid = _register_and_get_token(client, email='sub3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        sub_id = resp.get_json()['subscription']['id']

        resp = client.post(f'/api/subscriptions/{sub_id}/billing',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        billing = resp.get_json()['billing']
        assert billing['status'] == BillingStatus.PAID.value

    def test_fail_billing_and_retry(self, client, app):
        uid = _register_and_get_token(client, email='sub4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        sub_id = resp.get_json()['subscription']['id']

        # Fail billing
        resp = client.post(f'/api/subscriptions/{sub_id}/billing/fail',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        billing = resp.get_json()['billing']
        assert billing['status'] == BillingStatus.FAILED.value
        assert resp.get_json()['subscription']['status'] == SubscriptionStatus.PAST_DUE.value

        # Retry billing
        resp = client.post(f'/api/billings/{billing["id"]}/retry',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['billing']['status'] == BillingStatus.PAID.value

    def test_cancel_subscription(self, client, app):
        uid = _register_and_get_token(client, email='sub5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        sub_id = resp.get_json()['subscription']['id']

        resp = client.post(f'/api/subscriptions/{sub_id}/cancel',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['subscription']['status'] == SubscriptionStatus.CANCELLED.value
        assert resp.get_json()['subscription']['autoRenew'] is False

    def test_suspend_and_reactivate(self, client, app):
        uid = _register_and_get_token(client, email='sub6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        sub_id = resp.get_json()['subscription']['id']

        resp = client.post(f'/api/subscriptions/{sub_id}/suspend',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['subscription']['status'] == SubscriptionStatus.SUSPENDED.value

        resp = client.post(f'/api/subscriptions/{sub_id}/reactivate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['subscription']['status'] == SubscriptionStatus.ACTIVE.value

    def test_billing_history(self, client, app):
        uid = _register_and_get_token(client, email='sub7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        sub_id = resp.get_json()['subscription']['id']

        client.post(f'/api/subscriptions/{sub_id}/billing',
                    content_type='application/json', headers=headers)

        resp = client.get(f'/api/subscriptions/{sub_id}/billing/history',
                          headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['billings']) >= 1


class TestReferralE2E:
    """E2E: Create referral → register → convert → reward."""

    def test_create_referral(self, client, app):
        uid = _register_and_get_token(client, email='ref1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/referrals',
                           data=json.dumps({
                               'referredEmail': 'friend@example.com',
                               'rewardAmount': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        ref = resp.get_json()['referral']
        assert ref['status'] == ReferralStatus.PENDING.value
        assert ref['code'] is not None
        assert 'link' in ref

    def test_register_and_convert_referral(self, client, app):
        uid = _register_and_get_token(client, email='ref2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create referral
        resp = client.post('/api/referrals',
                           data=json.dumps({
                               'referredEmail': 'friend2@example.com',
                               'rewardAmount': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        code = resp.get_json()['referral']['code']

        # Register (friend signs up)
        resp = client.post('/api/referrals/register',
                           data=json.dumps({
                               'code': code,
                               'referredUserId': 2,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['referral']['status'] == ReferralStatus.REGISTERED.value

        # Convert
        resp = client.post('/api/referrals/convert',
                           data=json.dumps({'code': code}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['referral']['status'] == ReferralStatus.CONVERTED.value

    def test_reward_referral(self, client, app):
        uid = _register_and_get_token(client, email='ref3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/referrals',
                           data=json.dumps({
                               'referredEmail': 'friend3@example.com',
                               'rewardAmount': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        ref_id = resp.get_json()['referral']['id']
        code = resp.get_json()['referral']['code']

        client.post('/api/referrals/register',
                    data=json.dumps({'code': code, 'referredUserId': 2}),
                    content_type='application/json', headers=headers)
        client.post('/api/referrals/convert',
                    data=json.dumps({'code': code}),
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/referrals/{ref_id}/reward',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['referral']['status'] == ReferralStatus.REWARDED.value

    def test_referral_stats(self, client, app):
        uid = _register_and_get_token(client, email='ref4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/referrals',
                    data=json.dumps({'referredEmail': 'friend4@example.com'}),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/referrals/stats', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['stats']['total'] >= 1

    def test_referral_cannot_self_refer(self, client, app):
        uid = _register_and_get_token(client, email='ref5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/referrals',
                           data=json.dumps({
                               'referredEmail': 'ref5@test.com',
                               'referrerEmail': 'ref5@test.com',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400


class TestAIAgentE2E:
    """E2E: Configure agent → enable → execute → propose action → approve → audit."""

    def test_configure_agent(self, client, app):
        uid = _register_and_get_token(client, email='ai1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'monthlyCostLimit': 50.0,
                               'monthlyUsageLimit': 5000,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        agent = resp.get_json()['agent']
        assert agent['status'] == AgentStatus.DISABLED.value
        assert agent['agentType'] == AgentType.FINANCIAL.value

    def test_enable_agent_requires_consent(self, client, app):
        uid = _register_and_get_token(client, email='ai2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                           }),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        # Try to enable without consent
        resp = client.post(f'/api/agents/{agent_id}/enable',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

        # Set consent
        resp = client.post(f'/api/agents/{agent_id}/consent',
                           data=json.dumps({'consentGiven': True}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # Now enable
        resp = client.post(f'/api/agents/{agent_id}/enable',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['agent']['status'] == AgentStatus.ENABLED.value

    def test_execute_agent(self, client, app):
        uid = _register_and_get_token(client, email='ai3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Configure and enable
        resp = client.post('/api/agents',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                           }),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        # Execute
        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'prompt': 'Analyze cash flow for last month',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        execution = resp.get_json()['execution']
        assert execution['status'] == 'completed'
        assert execution['response'] is not None
        assert execution['aiGenerated'] is True
        assert execution['tokensUsed'] > 0
        assert execution['cost'] > 0

    def test_execute_agent_not_enabled(self, client, app):
        uid = _register_and_get_token(client, email='ai4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/agents',
                    data=json.dumps({'agentType': AgentType.FINANCIAL.value}),
                    content_type='application/json', headers=headers)

        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'prompt': 'Test',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_propose_and_approve_action(self, client, app):
        uid = _register_and_get_token(client, email='ai5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Configure and enable
        resp = client.post('/api/agents',
                           data=json.dumps({'agentType': AgentType.FINANCIAL.value}),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        # Execute
        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'prompt': 'Suggest pricing based on history',
                           }),
                           content_type='application/json', headers=headers)
        execution_id = resp.get_json()['execution']['id']

        # Propose action (pricing_change is sensitive → requires approval)
        resp = client.post(f'/api/agents/executions/{execution_id}/propose-action',
                           data=json.dumps({
                               'actionType': 'pricing_change',
                               'payload': {'price': 200.0},
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['requiresApproval'] is True
        assert resp.get_json()['action']['status'] == AgentActionStatus.PENDING.value

        # Approve action
        resp = client.post(f'/api/agents/executions/{execution_id}/approve',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['action']['status'] == AgentActionStatus.APPROVED.value

    def test_reject_action(self, client, app):
        uid = _register_and_get_token(client, email='ai6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({'agentType': AgentType.FINANCIAL.value}),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'prompt': 'Suggest pricing',
                           }),
                           content_type='application/json', headers=headers)
        execution_id = resp.get_json()['execution']['id']

        client.post(f'/api/agents/executions/{execution_id}/propose-action',
                    data=json.dumps({
                        'actionType': 'pricing_change',
                        'payload': {'price': 500.0},
                    }),
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/agents/executions/{execution_id}/reject',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['action']['status'] == AgentActionStatus.REJECTED.value

    def test_audit_trail(self, client, app):
        uid = _register_and_get_token(client, email='ai7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({'agentType': AgentType.CONTENT.value}),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        client.post('/api/agents/execute',
                    data=json.dumps({
                        'agentType': AgentType.CONTENT.value,
                        'prompt': 'Generate a caption for Instagram',
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/agents/audit', headers=headers)
        assert resp.status_code == 200
        trail = resp.get_json()['auditTrail']
        assert len(trail) >= 1
        assert trail[0]['aiGenerated'] is True
        assert trail[0]['prompt'] is not None
        assert trail[0]['response'] is not None

    def test_usage_stats(self, client, app):
        uid = _register_and_get_token(client, email='ai8@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/agents',
                    data=json.dumps({'agentType': AgentType.CONTENT.value}),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/agents/usage', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['agents']) >= 1

    def test_disable_agent(self, client, app):
        uid = _register_and_get_token(client, email='ai9@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({'agentType': AgentType.CONTENT.value}),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/agents/{agent_id}/disable',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['agent']['status'] == AgentStatus.DISABLED.value

    def test_non_sensitive_action_no_approval(self, client, app):
        """Content agent actions don't require approval."""
        uid = _register_and_get_token(client, email='ai10@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/agents',
                           data=json.dumps({'agentType': AgentType.CONTENT.value}),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        client.post(f'/api/agents/{agent_id}/enable',
                    content_type='application/json', headers=headers)

        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.CONTENT.value,
                               'prompt': 'Generate caption',
                           }),
                           content_type='application/json', headers=headers)
        execution_id = resp.get_json()['execution']['id']

        resp = client.post(f'/api/agents/executions/{execution_id}/propose-action',
                           data=json.dumps({
                               'actionType': 'generate_content',
                               'payload': {'caption': 'Test'},
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        # Content agent doesn't require approval for non-sensitive actions
        assert resp.get_json()['requiresApproval'] is False
        assert resp.get_json()['action']['status'] == AgentActionStatus.EXECUTED.value


class TestFullE2EFlow:
    """Full E2E: Subscription → billing → referral → AI agent → approval → audit."""

    def test_complete_flow(self, client, app):
        uid = _register_and_get_token(client, email='full7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # 1. Subscribe to monthly plan
        resp = client.post('/api/subscriptions',
                           data=json.dumps({
                               'planName': 'Pro Monthly',
                               'amount': 49.90,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        sub_id = resp.get_json()['subscription']['id']

        # 2. Process recurring billing (sandbox)
        resp = client.post(f'/api/subscriptions/{sub_id}/billing',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['billing']['status'] == BillingStatus.PAID.value

        # 3. Refer a friend with personalized link
        resp = client.post('/api/referrals',
                           data=json.dumps({
                               'referredEmail': 'friend_full@test.com',
                               'rewardAmount': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        code = resp.get_json()['referral']['code']
        ref_id = resp.get_json()['referral']['id']

        # 4. Friend registers and converts
        client.post('/api/referrals/register',
                    data=json.dumps({'code': code, 'referredUserId': 2}),
                    content_type='application/json', headers=headers)
        resp = client.post('/api/referrals/convert',
                           data=json.dumps({'code': code}),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['referral']['status'] == ReferralStatus.CONVERTED.value

        # 5. Enable Financial Agent
        resp = client.post('/api/agents',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'monthlyCostLimit': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        agent_id = resp.get_json()['agent']['id']

        client.post(f'/api/agents/{agent_id}/consent',
                    data=json.dumps({'consentGiven': True}),
                    content_type='application/json', headers=headers)
        resp = client.post(f'/api/agents/{agent_id}/enable',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # 6. Agent suggests pricing based on history
        resp = client.post('/api/agents/execute',
                           data=json.dumps({
                               'agentType': AgentType.FINANCIAL.value,
                               'prompt': 'Suggest pricing based on history',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        execution_id = resp.get_json()['execution']['id']
        assert resp.get_json()['execution']['aiGenerated'] is True

        # 7. Provider reviews and approves suggestion
        resp = client.post(f'/api/agents/executions/{execution_id}/propose-action',
                           data=json.dumps({
                               'actionType': 'pricing_change',
                               'payload': {'price': 200.0},
                           }),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['requiresApproval'] is True

        resp = client.post(f'/api/agents/executions/{execution_id}/approve',
                           content_type='application/json', headers=headers)
        assert resp.get_json()['action']['status'] == AgentActionStatus.APPROVED.value

        # 8. System records recommendation in audit
        resp = client.get('/api/agents/audit', headers=headers)
        assert resp.status_code == 200
        trail = resp.get_json()['auditTrail']
        assert len(trail) >= 1
        assert trail[0]['prompt'] == 'Suggest pricing based on history'
        assert trail[0]['response'] is not None
        assert trail[0]['aiGenerated'] is True
