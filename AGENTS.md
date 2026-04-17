[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# Information for all (human and agent) contributors

General information for contributors is in [CONTRIBUTING.md](CONTRIBUTING.md); please read that first and incorporate its
information into your approach.

# Modules

SLIME modules are defined by a top-level script, usually called `module.js`. This main module file often loads sibling files to
help implement the module, and sometimes loads files from subfolders if the module is sufficiently complex.

## `jsh` plugins

`jsh` plugins use a `plugin.jsh.js` to define their `jsh`-facing interface. Sometimes a `jsh` plugin will have no module interface
at all (if the module is designed only to be used in `jsh`).

# Testing and Documentation

## Fifty definitions

SLIME uses co-located documentation and tests (which it refers to as "definitions").

Definition files are typically sibling files of the `.js` implementation file that are written in TypeScript and use the extension
`.fifty.ts`. The TypeScript files contain both documentation and tests. They typically provide a `Context` type which defines the
type of the `$context` object passed to the module, and an `Exports` type which defines the interface provided by the module. The
type definitions of `Exports` contain documentation defining the semantics of the module's interface. The tests are implemented as
IIFEs that are provided a `fifty` object in their scope (of type `slime.fifty.test.Kit`) and implement tests by attaching functions
to the `fifty.tests` object. So to determine whether a specific function in an interface contains documentation, one would look at
the type definition foor that function in the `.fifty.ts` file. To determine whether it has test coverage, one would look at whether
it is invoked from within a Fifty test (which typically would be in the same file as the documentation, although of course some
tests in the project invoke other modules for various reasons).

Typically, the Fifty `.fifty.ts` file provides an `Exports` type which is exported from the `.js` file, usually via an `$export` function call (less often, by assigning to an `$exports` object). So the Fifty file defines the type definition for that set of exports, usually by the `$export` (or `$exports`) argument to the `.js` IIFE being of type `Exports`.

Fifty files heavily use TypeScript declaration merging, so looking at a single file's definition of a type may not capture the
entire definition.

## Older JSAPI definitions

Some other older modules use documentation using a literate HTML format called "JSAPI." JSAPI files have names like `api.html`
(for a top-level module definition), and `foo.api.html` (documentation for the `foo.js` script). JSAPI files are being migrated to
Fifty and should be targeted for refactoring and elimination.

Often Fifty files will contain tests with `jsapi` in the name. These were migrated from the JSAPI format. Often they could use some
refactoring, but they are much better than tests still executed via JSAPI.

## Testing

To run tests for a JavaScript (`.js`) file, look for a sibling file named `.fifty.ts` (for example, `run.fifty.ts` for `run.js`). Run the tests by executing the Fifty test tool on the `.fifty.ts` file, not the `.js` file itself.

For example, to run the tests for `rhino/shell/run.js`, use:
  ./fifty test.jsh rhino/shell/run.fifty.ts

This ensures you are running the actual test definitions, not just executing the script file.

### Testing = Modules

Typically the main module definition file (`module.fifty.ts`) will invoke the other script files needed to test the module as a whole, and then the test suite will just invoke the module file rather than invoking each script file in the module.

**Note:** The VSCode task labeled "Fifty (jsh): Run wip() Test in Current File" is designed for human development -- using the
convention of naming a test `wip` and allowing it to be invoked easily from VSCode -- and only runs the `wip` test for the file. To run *all* tests, you must omit the `--part wip` parameter, which defaults to running the `suite` part, which by convention means
all valid tests in the file.

To run all tests for a file:

* Java-compatible tests: `./fifty test.jsh <test-file>`
* Browser-compatible tests: `./fifty test.browser <test-file>`
* In both cases, a 0 exit status indicates the tests passed.

## Documentation

A module's documentation typically is contained in a primary TypeScript namespace. Namespaces with `internal` in the name are
designed for internal module or project use.

# GitHub integration

When asked to create a GitHub issue, use the format native to the GitHub Pull Requests extension rather than the format native to
the GitHub web interface.

Create the issue template in the `local/.github/ISSUE_TEMPLATE` folder, creating parents if necessary.

Issues with a strong focus on improving documentation should receive the `documentation` label, while issues focused on test
coverage should receive the `project` label.

# Developer workflow

When refactoring, always run `./wf tsc` after the refactor to make sure type-checking passed. If it does not, something is wrong.

# Code Quality

If you are asked for suggestions on how to improve the project, please use the information in this section.

* The top priorities should be high-usage modules and/or modules lacking in documentation or containing lots of JSAPI documentation
* The metrics provided by the tools below also indicate issues with the code that should be addressed, including lack of type
checking, ESLint errors, and files that need to be split.
* If modules are deprecated (have the `@deprecated` annotation in the namespace definition, or have `old` in the namespace name,
they can be deprioritized).

## Metrics you can access for assessing code quality

The project contains several `jsh` scripts you can run in order to generate metrics that will help you find targets for improvement.

Here is a list (remember, these commands must be invoked via `jsh`):

* `tools/code/metrics.jsh.js jsapi` - shows remaining JSAPI defnitions in the project
* `tools/code/metrics.jsh.js types` - shows TypeScript type-checking coverage (files are uncovered if they are JavaScript and do not
contain `@ts-check`; lines are uncovered if they follow a `@ts-ignore` except in whitelisted cases)
* `contributor/eslint.jsh.js` - runs ESLint
* `tools/code/metrics.jsh.js size` - runs a report listing files deemed to be "too big" and how much larger they are than desired.
