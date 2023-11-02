//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## `jsh` documentation
 *
 * Documentation about contributing to `jsh` can be browsed at the {@link slime.jsh.internal} TypeScript namespace.
 *
 * ## Compatibility updates
 *
 * ### TypeScript
 *
 * To update TypeScript, update the version in `tools/wf/module.js`, and make sure that there is a compatible TypeDoc version
 * declared for that version in `tools/wf/typescript.js`.
 *
 * ### Javassist
 *
 * Used in the Rhino profiler, it can be updated by editing the download URL in `rhino/tools/profiler/build.jsh.js`.
 *
 * ## Tools
 *
 * The `contributor/code/find-untyped-usages` `jsh` script can be used to search the SLIME codebase for usages of a particular
 * construct in files without typechecking (where a standard usages search might not find them, in other words).
 */
namespace slime.internal {

}
