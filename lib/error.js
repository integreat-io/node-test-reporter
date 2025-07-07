import { diff } from 'concordance'

const operatorToHumanExpectation = {
  equal: 'be equal',
  strictEqual: 'be strictly equal',
  deepEqual: 'be deep-equal',
  deepStrictEqual: 'be strictly deep-equal',
  notDeepEqual: 'not be deep-equal',
  notDeepStrictEqual: 'not be strictly deep-equal',
  partialDeepStrictEqual:
    'be strictly deep-equal (allowing `actual` to have properties not found in `expected`)',
}

const shouldDoOwnCompare = (operator) =>
  [
    'equal',
    'strictEqual',
    'deepEqual',
    'deepStrictEqual',
    'notDeepEqual',
    'notDeepStrictEqual',
    'partialDeepStrictEqual',
  ].includes(operator)

/**
 * Get cause message from Error object.
 */
function getCauseFromError(error) {
  const cause = error.cause
  if (cause && shouldDoOwnCompare(cause.operator)) {
    const expectation = operatorToHumanExpectation[cause.operator]
    const shouldHaveLegends = !cause.operator.startsWith('not')
    return `Expected values to ${expectation}:${
      shouldHaveLegends ? '\n+ expected - actual' : ''
    }\n\n${diff(cause.actual, cause.expected)}`
  }

  if (error.message) {
    return String(error.message)
  } else {
    return String(error)
  }
}

/**
 * Get the cause message. Often `cause` will be a JS Error object, but it may
 * also be a string.
 */
function getCause(cause) {
  if (typeof cause === 'string') {
    return cause
  } else if (cause instanceof Error) {
    return getCauseFromError(cause)
  } else {
    return 'Unknown'
  }
}

const lineColumnRegex = /^:(\d+):(\d+)/

/**
 * Extract line and column number from event. If possible, we'll get the line
 * and column from the stack trace, and fall back to the line and column on the
 * event if not. The reason we don't just use the numbers on the event, is that
 * they refer to the test case, not to the where the error actually occured.
 */
function extractLineColumn(event, file) {
  if (event.data.details.error?.cause?.stack) {
    const message = String(event.data.details.error?.cause?.stack)
    const index = message.indexOf(file)
    if (index > -1) {
      const text = message.slice(index + file.length)
      const match = lineColumnRegex.exec(text)
      if (match && match.length >= 3) {
        const line = match[1]
        const column = match[2]
        return [line, column]
      }
    }
  }
  return [event.data.line, event.data.column]
}

/**
 * Create error object from the given event. Will dive into the underlying
 * error to get the most concrete error message possible, and extract line and
 * column numbers from the stack trace when possible.
 */
export function createError(event) {
  const name = event.data.name
  const file = event.data.file
  const [line, column] = extractLineColumn(event, file)
  const type = event.data.details.error.failureType
  const cause = getCause(event.data.details.error)

  return { name, file, line, column, type, cause }
}
