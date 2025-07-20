//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## `jsh` documentation
 *
 * Documentation about contributing to `jsh` can be browsed at the {@link slime.jsh.internal slime.jsh.internal} TypeScript namespace.
 *
 * ## Compatibility updates
 *
 * ### Java
 *
 * SLIME manages Java VMs based on Amazon Corretto (though it can be configured to run under any JDK). Corretto end of life
 * information is available at [https://endoflife.date/amazon-corretto](https://endoflife.date/amazon-corretto).
 *
 * ### TypeScript
 *
 * To update TypeScript, update the version in `tools/wf/typescript.js`, and make sure that there is a compatible TypeDoc version
 * declared for that version.
 *
 * ### TypeDoc
 *
 * To update TypeDoc, map the desired TypeScript version to updated TypeDoc versions in `tools/wf/typescript.js`.
 *
 * ### Node.js
 *
 * To update Node.js, update the version in `rhino/tools/node/module.js`.
 *
 * ### Docker
 *
 * To update the Docker API type definitions, update the URL in `rhino/tools/docker/tools/types.jsh.js` to specify the new
 * OpenAPI YAML, then run the `rhino/tools/docker/tools/types.jsh.js`, which will emit a new
 * `rhino/tools/docker/tools/docker-api.d.ts`.
 *
 * ### Javassist
 *
 * Used in the Rhino profiler, it can be updated by editing the download URL in `rhino/tools/profiler/build.jsh.js`.
 *
 * ## Testing
 *
 * ### Creating fresh "clones" of the current source directory
 *
 * See {@link slime.jsh.wf.test.Fixtures}, specifically `clone()`, to set up mirrors of the current source code.
 *
 * ### Browser tests
 *
 * The containerized browser tests can be run from within the devcontainer:
 *
 * * Restart browser-specific container in Docker
 * * `./fifty test.browser --browser dockercompose:selenium:chrome contributor/browser.fifty.ts --interactive`
 * * Go to appropriate VNC port using HTTP to get a VNC client and use `secret` as the password
 *
 * ## Tools
 *
 * The `contributor/code/find-untyped-usages.jsh.js` script can be used to search the SLIME codebase for usages of a particular
 * construct in files without typechecking (where a standard usages search might not find them, in other words).
 */
namespace slime.internal {

}
