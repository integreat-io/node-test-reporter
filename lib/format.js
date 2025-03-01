import {
  colorText,
  colorFaded,
  colorOk,
  colorError,
  colorNeutral,
} from './colors.js'
import spinner from './spinner.js'

export const clearLine = '\r\x1b[K'

function formatMs(ms) {
  if (ms > 1000) {
    return `${Math.round(ms / 100) / 10}s`
  } else {
    return `${Math.round(ms * 10) / 10}ms`
  }
}

export function formatTestStatus(status) {
  const prevMs = status.spinnerMs
  status.spinnerMs = Date.now()
  if (status.running === 0) {
    // Don't output status until we're running
    return ''
  }
  if (status.spinnerMs - prevMs >= 50) {
    status.spinnerIndex++
  }

  const line = [
    spinner(status.spinnerIndex),
    `${colorNeutral(`Started ${status.running} tests.`)}`,
    status.passed ? `${colorOk(`${status.passed} passed`)}.` : undefined,
    status.failed ? `${colorError(`${status.failed} failed`)}.` : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  return `${clearLine}${line}`
}

export function formatTestLine(name, ms, isNewRun) {
  const line = `${name} ${colorFaded(`(${formatMs(ms)})\n`)}`
  const prefix = isNewRun ? '' : '\r\x1b[K'
  return prefix + line
}

export function formatCoverage(percent, covered, total) {
  const colorFn =
    percent >= 80 ? colorOk : percent >= 50 ? colorNeutral : colorError
  const percentText = `${Math.round(percent * 10) / 10} %`
  return `${colorFn(percentText)} (${covered} / ${total})`
}

export function formatSummary(summary) {
  return [
    colorText(
      `Ran ${summary.tests} tests${summary.suites ? ` in ${summary.suites} suites` : ''} ${colorFaded(`(${formatMs(summary.duration_ms)})`)}`,
    ),
    colorOk(`  ${summary.pass} passed`),
    summary.fail > 0 ? colorError(`  ${summary.fail} failed`) : undefined,
    summary.cancelled > 0
      ? colorError(
          `  ${summary.cancelled} ${summary.cancelled === 1 ? 'was' : 'were'} cancelled`,
        )
      : undefined,
    summary.skipped > 0
      ? colorNeutral(
          `  ${summary.skipped} ${summary.skipped === 1 ? 'was' : 'were'} skipped`,
        )
      : undefined,
    summary.todo > 0 ? colorFaded(`  ${summary.todo} todo`) : undefined,
    '\n',
  ]
    .filter(Boolean)
    .join('\n')
}

const ensureEndingLineshift = (str) => (str.endsWith('\n') ? str : `${str}\n`)

function formatCauseLine(line) {
  if (typeof line === 'string') {
    if (line === '+ expected - actual') {
      return `${colorOk('+')} expected ${colorError('-')} actual`
    } else if (line.startsWith('+')) {
      return `${colorOk('+')}${line.slice(1)} `
    } else if (line.startsWith('-')) {
      return `${colorError('-')}${line.slice(1)} `
    }
  }
  return line
}

function formatCause(cause) {
  const line = cause.split('\n').map(formatCauseLine).join('\n')
  return ensureEndingLineshift(line)
}

function formatFile(file) {
  const dir = process.cwd()
  if (typeof file === 'string' && file.startsWith(dir)) {
    return file.slice(dir.length)
  } else {
    return file
  }
}

function formatError(error) {
  return [
    colorError.bold(`Test '${error.name}' failed`),
    error.file
      ? `in file '${formatFile(error.file)}', line ${error.line}, column ${error.column}\n`
      : undefined,
    formatCause(error.cause),
  ]
    .filter(Boolean)
    .join('\n')
}

export const formatErrors = (errors) => errors.map(formatError).join('\n\n')

function formatMessage(message) {
  return [
    `${colorNeutral.bold('Message from test:')} ${message.message}`,
    message.file
      ? `in file '${formatFile(message.file)}', line ${message.line}, column ${message.column}`
      : undefined,
  ]
    .filter(Boolean)
    .join('\n')
}

export const formatMessages = (messages) =>
  messages.length > 0
    ? messages.map(formatMessage).join('\n\n') + '\n'
    : undefined

export const formatTestCoverage = (totals) =>
  [
    'Test coverage',
    `  Lines:     ${formatCoverage(totals.coveredLinePercent, totals.coveredLineCount, totals.totalLineCount)}`,
    `  Branches:  ${formatCoverage(totals.coveredBranchPercent, totals.coveredBranchCount, totals.totalBranchCount)}`,
    `  Functions: ${formatCoverage(totals.coveredFunctionPercent, totals.coveredFunctionCount, totals.totalFunctionCount)}`,
    ' ',
  ]
    .filter(Boolean)
    .join('\n')
