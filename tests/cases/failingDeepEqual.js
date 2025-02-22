import test from 'node:test'
import assert from 'node:assert/strict'

test('should fail with deepEqual', () => {
  const value = { id: 1, title: 'This is good' }
  const expected = { id: 1, title: 'This is better' }

  assert.deepEqual(value, expected)
})
