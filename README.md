# Test reporter for the node test runner

[![npm Version](https://img.shields.io/npm/v/node-test-reporter.svg)](https://www.npmjs.com/package/node-test-reporter)

This is a test reporter tailored to the node test runner, that was introduced
in node v18. The runner is tested with node v20 and v22, but should work in
other versions too. See [note below](#coverage) on coverage in v20.

The reporter will list all tests as they run, with a running count of the total
number of tests started and how many passed or failed. When done, we print all
diagnostic messages, errors, and a summary. If code coverage is enabled, we
print a summary of the coverage percentages too.

## Installing and using

```
npm install node-test-reporter -D
```

To run your tests:

```
node --test --test-reporter node-test-reporter 'src/**/*.test.js'
```

This is best run as a script in your `package.json`:

```
"scripts": {
  ...
  "test": "node --test --test-reporter node-test-reporter 'src/**/*.test.js'"
  ...
}
```

> [!NOTE]
> We use `'src/**/*.test.js'` here to include all files ending with `.test.js`
> below the `src` folder. The `**` glob have only worked like this since node
> v21, and only when surrounded by quotes. This was a breaking change in node.
> For older versions, you may use `src` (without quotes) instead. See
> [this disussion](https://github.com/nodejs/node/issues/50287) for more.

## TypeScript

To run TypeScript tests, install e.g. the [tsx](https://github.com/privatenumber/tsx)
package and run your tests like this:

```
node --import tsx --test --enable-source-maps --test-reporter node-test-reporter 'src/**/*.test.ts'
```

By enabling source maps with `--enable-source-maps`, you'll get the correct
line and column numbers for your `.ts` files.

## Coverage

Code coverage is still experimental in node v22, but may be included like this:

```
node --test --experimental-test-coverage --test-reporter node-test-reporter 'src/**/*.test.js'
```

> [!NOTE]
> The experimental test covarge is available from node v18, but has a bug in v20
> where it will throw an error in some instances. We recommend using v22 for
> coverage. See [this discusson](https://github.com/nodejs/node/issues/51552)
> for more.

## Running the tests

This repo ironically doesn't have any tests yet. :S

## Contributing

Please read
[CONTRIBUTING](https://github.com/integreat-io/node-test-reporter/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull
requests.

## License

This project is licensed under the ISC License - see the
[LICENSE](https://github.com/integreat-io/node-test-reporter/blob/master/LICENSE)
file for details.
