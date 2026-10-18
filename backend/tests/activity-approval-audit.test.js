import test from "node:test";
import assert from "node:assert/strict";
import { validateApprovalInput } from "../services/admin.service.js";

test("approval accepts only explicit booleans", () => {
  assert.equal(validateApprovalInput(true), true);
  assert.equal(validateApprovalInput(false), false);
  for (const value of ["false", 0, 1, null, undefined]) {
    assert.throws(() => validateApprovalInput(value), (error) => error.statusCode === 400);
  }
});
