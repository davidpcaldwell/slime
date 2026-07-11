[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# SLIME: Documentation for contributors

## Runtime

Embeddings that load the runtime should execute `loader/expression.js` with an appropriate object of type
{@link slime.runtime.Scope} in scope with the name `scope`; the expression evaluates to an object of type
{@link slime.runtime.Exports}. See {@link slime.runtime.internal} for details.

## `jsh` documentation

Documentation about contributing to `jsh` can be browsed at the {@link slime.jsh.internal slime.jsh.internal} TypeScript
namespace.

## Compatibility updates

### Java

SLIME manages Java VMs based on Amazon Corretto (though it can be configured to run under any JDK). Corretto end of life
information is available at [https://endoflife.date/amazon-corretto](https://endoflife.date/amazon-corretto).

### TypeScript

To update TypeScript, update the version in `tools/wf/typescript.js`, and make sure that there is a compatible TypeDoc version
declared for that version.

### TypeDoc

To update TypeDoc, map the desired TypeScript version to updated TypeDoc versions in `tools/wf/typescript.js`.

### Node.js

To update Node.js, update the version in `rhino/tools/node/module.js`.

### Docker

To update the Docker API type definitions, update the URL in `rhino/tools/docker/tools/types.jsh.js` to specify the new
OpenAPI YAML, then run the `rhino/tools/docker/tools/types.jsh.js`, which will emit a new
`rhino/tools/docker/tools/docker-api.d.ts`.

### Javassist

Used in the Rhino profiler, it can be updated by editing the download URL in `rhino/tools/profiler/build.jsh.js`.

## Testing

### Testing specific scenarios

#### Creating fresh "clones" of the current source directory locally

See {@link slime.jsh.wf.test.Fixtures}, specifically `clone()`, to set up mirrors of the current source code.

#### Creating a fresh "clone" of the current source directory in Docker

A new container hosting SLIME can be started via the following commands, with various configurations:

* `test-docker-clean-start`: Starts the SLIME development Docker Compose application, with the source code mounted in the
`local` container but excluding the `local` directory.
* `test-docker-clean-run`: Starts the SLIME development Docker Compose application, with the source code mounted in the
`local` container but excluding the `local` directory, and logs you into the `local` service.
* `test-docker-clean-jsh <jdk-version> <script> [arguments]`: Creates a Docker image with the SLIME source code baked in (and an empty `local/` directory), as is
done in the CI environment, and runs a `jsh` script using the specified JDK (specified by the `JDK_VERSION` environment variable)
inside the container.
* `test-docker-clean-command <jdk-version> <command> [arguments]`: Creates a Docker image with the SLIME source code baked in
(and an empty `local/` directory), as is done in the CI environment, installs the specified JDK, and then executes the provided
command (plus any additional arguments) inside the container.

### Browser tests

The containerized browser tests can be run from within the devcontainer:

* Ensure you are in the `local` devcontainer service.
* Run browser-specific Fifty tests:
  * `./fifty test.browser --browser chrome contributor/browser.fifty.ts --interactive`
  * `./fifty test.browser --browser firefox contributor/browser.fifty.ts --interactive`
* Use the Webtop desktop on port 3000 to observe interactive browser runs.

### Test suite performance

The fifty tests output timing information to the console. To find fifty test stages that take >10s in a `test.jsh` log file,
grep the file for `\(\d*\d{5} ms`.

## Documentation

### Namespaces split across multiple files

For namespace comments TypeDoc will handle namespaces split across multiple files by using, it seems, the longest comment
declaring the namespace; see [GitHub issue](https://github.com/TypeStrong/typedoc/issues/1855).

For namespaces split across multiple files, SLIME adopts a convention of creating a file called `_.fifty.ts`
to contain simply a namespace declaration and the top-level namespace comment, to try to eliminate guesswork about which
file should contain the namespace comment.

## Tools

The `contributor/code/find-untyped-usages.jsh.js` script can be used to search the SLIME codebase for usages of a particular
construct in files without typechecking (where a standard usages search might not find them, in other words).
