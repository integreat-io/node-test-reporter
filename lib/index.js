import { colorText, colorOk, colorError, colorNeutral } from './colors.js'
import {
  formatSummary,
  formatErrors,
  formatMessages,
  formatTestCoverage,
  formatTestStatus,
  formatTestLine,
  clearLine,
} from './format.js'
import { createError } from './error.js'
import { setTimeout } from 'node:timers'

const TIME_TO_HANG = 5000

function clearTestStatus(status = {}) {
  status.running = 0
  status.passed = 0
  status.failed = 0
  status.spinnerIndex = 0
  status.spinnerMs = Date.now()
  return status
}

function addToSummary(event, summary) {
  const message = event.data.message
  const parts = message.split(' ')
  const type = parts[0]
  const count = parts[1]
  summary[type] = Number.parseInt(count)
  return type === 'duration_ms'
}

const summaryTypes = [
  'tests',
  'suites',
  'pass',
  'fail',
  'cancelled',
  'skipped',
  'todo',
  'duration_ms',
]

function isSummaryDiagnostic(event) {
  const type = event.data.message.split(' ')[0]
  return summaryTypes.includes(type)
}

function lineFromEvent(event) {
  return event.data.skip
    ? `${colorNeutral.bold('-')} ${event.data.name}`
    : `${colorOk.bold('✓')} ${event.data.name}`
}
function lineFromFailed(event) {
  return `${colorError.bold('x')} ${event.data.name}`
}

const createMessage = (event) => ({
  message: event.data.message,
  file: event.data.file,
  line: event.data.line,
  column: event.data.column,
})

const isFile = (event) => event.data.file.endsWith(event.data.name)
const isTodo = (event) => event.data.todo

function printErrors(errors) {
  console.log(formatErrors(errors))
}

export default async function* customReporter(source) {
  let summary = {}
  let errors = []
  let messages = []
  let isRunComplete = false
  const status = clearTestStatus()

  let timeout = setTimeout(() => printErrors(errors), TIME_TO_HANG)

  for await (const event of source) {
    switch (event.type) {
      case 'test:enqueue':
        if (!isFile(event) && !isTodo(event)) {
          status.running++

          if (timeout) {
            clearTimeout(timeout)
          }
          timeout = setTimeout(() => printErrors(errors), TIME_TO_HANG)

          if (isRunComplete) {
            isRunComplete = false
            yield '---\n'
          }
          yield formatTestStatus(status)
        }
        break
      case 'test:pass':
        if (!isFile(event) && !isTodo(event)) {
          status.passed++
          const line = lineFromEvent(event)
          yield formatTestLine(
            line,
            event.data.details.duration_ms,
            isRunComplete,
          )
          yield formatTestStatus(status)
        }
        isRunComplete = false
        break
      case 'test:fail':
        if (!isFile(event) && !isTodo(event)) {
          status.failed++
          errors.push(createError(event))
          const line = lineFromFailed(event)
          yield formatTestLine(
            line,
            event.data.details.duration_ms,
            isRunComplete,
          )
          yield formatTestStatus(status)
        }
        isRunComplete = false
        break
      case 'test:plan':
        yield clearLine
        break
      case 'test:diagnostic':
        if (isSummaryDiagnostic(event)) {
          if (addToSummary(event, summary)) {
            if (timeout) {
              clearTimeout(timeout)
            }

            const line = [
              ' ',
              formatMessages(messages),
              formatErrors(errors),
              formatSummary(summary),
            ]
              .filter(Boolean)
              .join('\n\n')

            summary = {}
            errors = []
            messages = []
            isRunComplete = true
            clearTestStatus(status)
            yield line
          }
        } else {
          messages.push(createMessage(event))
        }
        break
      case 'test:stderr':
        yield colorError(`${event.data.message}`)
        break
      case 'test:stdout':
        yield colorText(`${event.data.message}`)
        break
      case 'test:coverage':
        yield formatTestCoverage(event.data.summary.totals)
        break
      default:
        // Update the status at all other events too, to keep the spinner going
        // as steady as possible.
        yield formatTestStatus(status)
    }
  }
}
