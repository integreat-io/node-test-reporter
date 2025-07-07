/* eslint-disable no-control-regex */
import test from 'tape'
import { getSimilarity } from 'calculate-string-similarity'
import runTests from './helpers/runTests.js'

// Tests

test('should start spinner with status', async (t) => {
  const expected = /^\r\x1B\[K. Started 1 tests\./

  const result = await runTests(['passing'])

  t.match(result[0], expected)
})

test('should list successful test', async (t) => {
  const expected = /^\r\x1B\[K✓ should pass \(\d+(\.\d+)?ms\)\n/

  const result = await runTests(['passing'])

  t.match(result[4], expected)
})

test('should list failing test', async (t) => {
  const expected = /^\r\x1B\[Kx should fail \(\d+(\.\d+)?ms\)\n/

  const result = await runTests(['failing'])

  t.match(result[4], expected)
})

test('should output error from failing test', async (t) => {
  const expected =
    /^ \n\nTest 'should fail' failed\nin file '\/tests\/cases\/failing\.js', line 5, column 10\n\nExpected values to be strictly equal:\n\+ expected - actual\n\n-\strue\s\n\+\sfalse\s\n/

  const result = await runTests(['failing'])

  t.match(result[result.length - 1], expected)
})

test('should end with summary', async (t) => {
  const expected =
    /Ran 2 tests \(\d\d\d?ms\)\n\s{2}1 passed\n\s{2}1 failed\n\n$/

  const result = await runTests(['passing', 'failing'])

  t.match(result[result.length - 1], expected)
})

test('should be rather similar (we allow different ms)', async (t) => {
  const expected = `\r\x1B[K✓ should pass (0.3ms)
\r\x1B[K\

Ran 1 tests (57ms)
  1 passed

`

  const result = await runTests(['passing'])

  const output = result.filter((line) => !line.includes('Started')).join('')
  const diff = getSimilarity(expected, output)
  t.true(diff > 90, `should be pretty similar (was ${diff})`)
})
