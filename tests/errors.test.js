import test from 'tape'
import runTests from './helpers/runTests.js'

// Tests

test('should output equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail with equal' failed\nin file '\/tests\/cases\/failingEqual\.js', line 5, column 10\n\nExpected values to be strictly equal:\n\+ expected - actual\n\n-\s'the actual'\s\n\+\s'the expected'\s\n/

  const result = await runTests(['failingEqual'])

  t.match(result[result.length - 1], expected)
})

test('should output non-string equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail' failed\nin file '\/tests\/cases\/failing\.js', line 5, column 10\n\nExpected values to be strictly equal:\n\+ expected - actual\n\n-\strue\s\n\+\sfalse\s\n/

  const result = await runTests(['failing'])

  t.match(result[result.length - 1], expected)
})

test('should output deep equal error', async (t) => {
  const expected =
    /^ \n\nTest 'should fail with deepEqual' failed\nin file '\/tests\/cases\/failingDeepEqual.js', line 8, column 10\n\nExpected values to be strictly deep-equal:\n\+ expected - actual\n\n\s{2}\{\n\s{4}id: 1,\n-\s{3}title: 'This is good', \n\+\s{3}title: 'This is better', \n\s{2}\}\n/

  const result = await runTests(['failingDeepEqual'])

  t.match(result[result.length - 1], expected)
})

test('should output error from ok', async (t) => {
  const expected =
    /^ \n\nTest 'should fail with ok' failed\nin file '\/tests\/cases\/failingOk\.js', line 5, column 10\n\nThe expression evaluated to a falsy value:\n\n\s\sassert\.ok\(false\)\n/

  const result = await runTests(['failingOk'])

  t.match(result[result.length - 1], expected)
})

test('should output error from hang', async (t) => {
  const expected = /\n\nRan 1 tests/

  const result = await runTests(['failingWithHang'])

  t.match(result[result.length - 1], expected)
})
