[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# Testing

To run tests for a JavaScript (`.js`) file, look for a sibling file named `.fifty.ts` (for example, `run.fifty.ts` for `run.js`). Run the tests by executing the Fifty test tool on the `.fifty.ts` file, not the `.js` file itself.

For example, to run the tests for `rhino/shell/run.js`, use:
  ./fifty test.jsh rhino/shell/run.fifty.ts

This ensures you are running the actual test definitions, not just executing the script file.

**Note:** The VSCode task labeled "Fifty (jsh): Run wip() Test in Current File" is designed for human development -- using the
convention of naming a test `wip` and allowing it to be invoked easily from VSCode -- and only runs the `wip` test for the file. To run *all* tests, you must omit the `--part wip` parameter, which defaults to running the `suite` part, which by convention means
all valid tests in the file.

To run all tests for a file:
  - Java-compatible tests: `./fifty test.jsh <test-file>`
  - Browser-compatible tests: `./fifty test.browser <test-file>`
  - In both cases, a 0 exit status indicates the tests passed.
