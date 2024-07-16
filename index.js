import chalk from "chalk";
import ora from "ora";

function formatMs(ms) {
  if (ms > 1000) {
    return `${Math.round(ms / 100) / 10}s`;
  } else {
    return `${Math.round(ms * 10) / 10}ms`;
  }
}

function formatCoverage(percent, covered, total) {
  const colorFn =
    percent >= 80 ? chalk.green : percent >= 50 ? chalk.yellow : chalk.red;
  const percentText = `${Math.round(percent * 10) / 10} %`;
  return `${colorFn(percentText)} (${covered} / ${total})`;
}

function formatSummary(summary) {
  return [
    chalk.white(
      `Ran ${summary.tests} tests${summary.suites ? ` in ${summary.suites} suites` : ""} ${chalk.grey(`(${formatMs(summary.duration_ms)})`)}`,
    ),
    chalk.green(`  ${summary.pass} passed`),
    summary.fail > 0 ? chalk.red(`  ${summary.fail} failed`) : undefined,
    summary.cancelled > 0
      ? chalk.red(
          `  ${summary.cancelled} ${summary.cancelled === 1 ? "was" : "were"} cancelled`,
        )
      : undefined,
    summary.skipped > 0
      ? chalk.yellow(
          `  ${summary.skipped} ${summary.skipped === 1 ? "was" : "were"} skipped`,
        )
      : undefined,
    summary.todo > 0 ? chalk.grey(`  ${summary.todo} todo`) : undefined,
    "\n",
  ]
    .filter(Boolean)
    .join("\n");
}

function addToSummary(event, summary) {
  const message = event.data.message;
  const parts = message.split(" ");
  const type = parts[0];
  const count = parts[1];
  // eslint-disable-next-line security/detect-object-injection
  summary[type] = Number.parseInt(count);
  return type === "duration_ms";
}

const summaryTypes = [
  "tests",
  "suites",
  "pass",
  "fail",
  "cancelled",
  "skipped",
  "todo",
  "duration_ms",
];

function isSummaryDiagnostic(event) {
  const type = event.data.message.split(" ")[0];
  return summaryTypes.includes(type);
}

function formatTestLine(name, ms, isNewRun) {
  const line = `${name} ${chalk.grey(`(${formatMs(ms)})`)}`;
  const prefix = isNewRun ? "" : "\r\x1b[K";
  return prefix + line;
}

function lineFromEvent(event) {
  return event.data.skip
    ? `${chalk.yellow.bold("-")} ${event.data.name}`
    : `${chalk.green.bold("✓")} ${event.data.name}`;
}
function lineFromFailed(event) {
  return `${chalk.red.bold("x")} ${event.data.name}`;
}

const getCause = (cause) =>
  typeof cause === "string"
    ? cause
    : cause instanceof Error
      ? cause.message || String(cause)
      : "Unknown";

const createError = (event) => ({
  name: event.data.name,
  file: event.data.file,
  line: event.data.line,
  column: event.data.column,
  type: event.data.details.error.failureType,
  cause: getCause(event.data.details.error.cause),
});

const createMessage = (event) => ({
  message: event.data.message,
  file: event.data.file,
  line: event.data.line,
  column: event.data.column,
});

const ensureEndingLineshift = (str) => (str.endsWith("\n") ? str : `${str}\n`);

function formatCauseLine(line) {
  if (typeof line === 'string') {
    if (line.startsWith("+ actual")) {
      return line
        .replace(
          "+ actual - expected",
          `${chalk.green("+")} expected ${chalk.red("-")} actual`,
        )
        .replace("...", chalk.grey("…"));
    } else if (line.startsWith("+")) {
      return `${chalk.red("-")}${line.slice(1)} `;
    } else if (line.startsWith("-")) {
      return `${chalk.green("+")}${line.slice(1)} `;
    } else if (line === "...") {
      return chalk.grey("…");
    }
  }
  return line;
}

function formatCause(cause) {
  const line = cause.split("\n").map(formatCauseLine).join("\n");
  return ensureEndingLineshift(line);
}

function formatFile(file) {
  const dir = process.cwd();
  if (typeof file === 'string' && file.startsWith(dir)) {
    return file.slice(dir.length);
  } else {
    return file;
  }
}

function formatError(error) {
  return [
    chalk.red.bold(`Test '${error.name}' failed`),
    error.file ? `in file '${formatFile(error.file)}', line ${error.line}, column ${error.column}\n` : undefined,
    formatCause(error.cause),
  ].filter(Boolean).join("\n");
}

const formatErrors = (errors) => errors.map(formatError).join("\n\n");

function formatMessage(message) {
  return [
    `${chalk.yellow.bold("Message from test:")} ${message.message}`,
    message.file ? `in file '${formatFile(message.file)}', line ${message.line}, column ${message.column}` : undefined,
  ].filter(Boolean).join("\n");
}

const formatMessages = (messages) =>
  messages.length > 0
    ? messages.map(formatMessage).join("\n\n") + "\n"
    : undefined;

const isFile = (event) => event.data.file.endsWith(event.data.name);
const isTodo = (event) => event.data.todo;

const formatTestStatus = (status) =>
  [
    `${chalk.yellow(`Started ${status.running} tests.`)}`,
    status.passed ? `${chalk.green(`${status.passed} passed`)}.` : undefined,
    status.failed ? `${chalk.red(`${status.failed} failed`)}.` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

const formatTestCoverage = (totals) =>
  [
    "Test coverage",
    `  Lines:     ${formatCoverage(totals.coveredLinePercent, totals.coveredLineCount, totals.totalLineCount)}`,
    `  Branches:  ${formatCoverage(totals.coveredBranchPercent, totals.coveredBranchCount, totals.totalBranchCount)}`,
    `  Functions: ${formatCoverage(totals.coveredFunctionPercent, totals.coveredFunctionCount, totals.totalFunctionCount)}`,
    " ",
  ]
    .filter(Boolean)
    .join("\n");

function clearStatus(status = {}) {
  status.running = 0;
  status.passed = 0;
  status.failed = 0;
  return status;
}

export default async function* customReporter(source) {
  let summary = {};
  let errors = [];
  let messages = [];
  let isRunComplete = false;
  const status = clearStatus();
  let spinner = ora();

  for await (const event of source) {
    switch (event.type) {
      case "test:enqueue":
        if (!isFile(event) && !isTodo(event)) {
          status.running++;
          if (isRunComplete) {
            isRunComplete = false;
            console.log("---\n");
          }
          spinner.start(formatTestStatus(status));
        }
        break;
      case "test:pass":
        if (!isFile(event) && !isTodo(event)) {
          status.passed++;
          const line = lineFromEvent(event);
          console.log(
            formatTestLine(line, event.data.details.duration_ms, isRunComplete),
          );
          spinner.start(formatTestStatus(status));
        }
        isRunComplete = false;
        break;
      case "test:fail":
        if (!isFile(event) && !isTodo(event)) {
          status.failed++;
          errors.push(createError(event));
          const line = lineFromFailed(event);
          console.log(
            formatTestLine(line, event.data.details.duration_ms, isRunComplete),
          );
          spinner.start(formatTestStatus(status));
        }
        isRunComplete = false;
        break;
      case "test:plan":
        spinner.stop();
        break;
      case "test:diagnostic":
        if (isSummaryDiagnostic(event)) {
          if (addToSummary(event, summary)) {
            const line = [
              " ",
              formatMessages(messages),
              formatErrors(errors),
              formatSummary(summary),
            ]
              .filter(Boolean)
              .join("\n\n");

            summary = {};
            errors = [];
            messages = [];
            isRunComplete = true;
            clearStatus(status);
            console.log(line);
          }
        } else {
          messages.push(createMessage(event));
        }
        break;
      case "test:stderr":
        console.log(chalk.red(`${event.data.message}`));
        break;
      case "test:stdout":
        console.log(chalk.white(`${event.data.message}`));
        break;
      case "test:coverage":
        console.log(formatTestCoverage(event.data.summary.totals));
        break;
      // default:
      //   console.log(event)
    }
  }
}
