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
 * Sentinel marking a sparse array hole (an "empty item"). Before diffing, we
 * replace holes with instances of this class. Concordance otherwise treats a
 * hole and an explicit `undefined` as equal, so without this it would report no
 * difference even though Node's assert failed. The class is module-private, so
 * no real value can ever be mistaken for a hole.
 */
class EmptyItem {}

/**
 * Concordance plugin that renders `EmptyItem` sentinels as `<empty item>` and
 * treats any two of them as equal. Uses Concordance's plugin API (apiVersion 1).
 */
const emptyItemPlugin = {
  name: 'node-test-reporter:empty-item',
  apiVersion: 1,
  serializerVersion: 1,
  register(api) {
    const tag = Symbol('EmptyItemValue')
    class EmptyItemValue {
      compare(expected) {
        return expected.tag === tag ? api.DEEP_EQUAL : api.UNEQUAL
      }
      formatDeep() {
        return api.lineBuilder.single('<empty item>')
      }
      serialize() {
        return null
      }
    }
    Object.defineProperty(EmptyItemValue.prototype, 'isPrimitive', {
      value: true,
    })
    Object.defineProperty(EmptyItemValue.prototype, 'tag', { value: tag })

    const instance = new EmptyItemValue()
    const describe = () => instance
    api.addDescriptor(0x01, tag, describe)
    return (value) => (value instanceof EmptyItem ? describe : null)
  },
}

/**
 * Recursively replace sparse array holes with `EmptyItem` sentinels, so the
 * diff can distinguish them from `undefined`. Descends into arrays and plain
 * objects only — other values (Maps, Sets, class instances, etc.) are left
 * untouched so Concordance renders them as it normally would. Guards against
 * circular references with a `WeakSet`.
 */
function normalizeSparse(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value
  }

  if (Array.isArray(value)) {
    seen.add(value)
    const result = value.map((item) => normalizeSparse(item, seen))
    // `map` skips holes, leaving them as holes — fill them with sentinels.
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) {
        result[index] = new EmptyItem()
      }
    }
    return result
  }

  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) {
    seen.add(value)
    const result = {}
    for (const key of Reflect.ownKeys(value)) {
      result[key] = normalizeSparse(value[key], seen)
    }
    return result
  }

  return value
}

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
    }\n\n${diff(
      normalizeSparse(cause.actual),
      normalizeSparse(cause.expected),
      {
        plugins: [emptyItemPlugin],
      },
    )}`
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
