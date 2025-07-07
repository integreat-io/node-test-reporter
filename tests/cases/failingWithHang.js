import test from 'node:test'
import assert from 'node:assert/strict'

// NOTE: This test will always succeed, but it's here to test the timeout
// feature, where all errors will be printed to `console.log` when no new tests
// run within 5 seconds. Because it has to be written to `console.log`, it's
// hard to test, but by manually removing the `t.after`, we can create a hang.
test('should not fail with running process', (t) => {
  const intervalId = setInterval(() => undefined, 1000)
  t.after(() => {
    clearInterval(intervalId)
  })

  assert.equal('a', 'a')
})
