// import { tap } from "node:test/reporters";
import { run } from 'node:test'
import reporter from '../../lib/index.js'

const __dirname = import.meta.dirname.slice(0, -8) // Remove the last 8 chars -- refering to the helpers folder

/**
 * Run the given test file (in the `/tests/cases` folder), and return output as
 * a string.
 */
export default async function runTest(testFiles) {
  // Run the test
  const stream = run({
    files: testFiles.map((file) => `${__dirname}/cases/${file}.js`),
  }).compose(reporter)

  // Retrieve and return the output from the test
  const result = []
  for await (let chunk of stream) {
    result.push(chunk)
  }
  return result.filter(Boolean)
}
