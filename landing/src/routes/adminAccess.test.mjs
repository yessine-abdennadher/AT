import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminRole } from '../services/adminAccess.mjs';

test('allows_admin_role_only', () => {
  assert.equal(isAdminRole('admin'), true);
});

test('denies_user_partner_and_unknown_roles', () => {
  for (const role of ['user', 'partner', 'ADMIN', 'owner', undefined, 1]) {
    assert.equal(isAdminRole(role), false);
  }
});

test('denies_null_user', () => {
  assert.equal(isAdminRole(null), false);
});
