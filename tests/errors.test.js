import test from 'tape'
import runTests from './helpers/runTests.js'

// Tests

test('should output simple equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail' failed\nin file '\/tests\/cases\/failing\.js', line 5, column 10\n\nExpected values to be strictly equal:\n\+ expected - actual\n\n-\strue\s\n\+\sfalse\s\n/

  const result = await runTests(['failing'])

  t.match(result[result.length - 1], expected)
})

test('should output equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail with equal' failed\nin file '\/tests\/cases\/failingEqual\.js', line 5, column 10\n\nExpected values to be strictly equal:\n\+ expected - actual\n\n-\s'the actual'\s\n\+\s'the expected'\s\n/

  const result = await runTests(['failingEqual'])

  t.match(result[result.length - 1], expected)
})

test('should output deep equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail with deepEqual' failed\nin file '\/tests\/cases\/failingDeepEqual.js', line 8, column 10\n\nExpected values to be strictly deep-equal:\n\+ expected - actual\n\n\s{2}\{\n\s{4}id: 1,\n-\s{3}title: 'This is good', \n\+\s{3}title: 'This is better', \n\s{2}\}\n/

  const result = await runTests(['failingDeepEqual'])

  t.match(result[result.length - 1], expected)
})
