import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAdminMfaLogin, verifyAdminMfa } from './adminMfa.mjs';

test('recognizes_mfa_challenge', () => {
  assert.throws(
    () => parseAdminMfaLogin({ mfaRequired: true, challengeId: 'challenge-1', maskedEmail: 'a***@test.tn' }),
    (error) => error.name === 'AdminMfaRequiredError'
      && error.challenge.challengeId === 'challenge-1'
      && error.challenge.maskedEmail === 'a***@test.tn'
  );
});

test('passes_through_normal_login', () => {
  const user = { id: 'u-1', role: 'user' };
  assert.deepEqual(parseAdminMfaLogin({ user }), { user });
});

test('rejects_mfa_response_without_challenge_id', () => {
  assert.throws(() => parseAdminMfaLogin({ mfaRequired: true }), /challenge/i);
});

test('verifies_admin_otp_returns_user', async () => {
  const user = { id: 'admin-1', role: 'admin' };
  const result = await verifyAdminMfa('challenge-1', '123456', async (path, init) => {
    assert.equal(path, '/auth/admin/mfa/verify');
    assert.deepEqual(JSON.parse(init.body), { challengeId: 'challenge-1', otp: '123456' });
    return { user };
  });
  assert.deepEqual(result, user);
});
