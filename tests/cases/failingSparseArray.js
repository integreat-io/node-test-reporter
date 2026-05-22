import test from 'node:test'
import assert from 'node:assert/strict'

test('should fail with sparse array diff', () => {
  const value = Array(3)
  value[2] = { id: 'ent1' }
  const expected = [undefined, undefined, { id: 'ent1' }]

  assert.deepEqual(value, expected)
})
