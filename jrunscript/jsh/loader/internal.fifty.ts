//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## Execution
 *
 * Generally speaking, the execution of the shell is governed by the `inonit.script.jsh.Shell.Execution` class. Both the Rhino and
 * Nashorn engines provide implementations of this class, and use them (separately) to help them implement their methods related to
 * executing shells.
 *
 * This method generally follows the following steps:
 *
 * * Provides the engine's classpath implementation to the `inonit.script.jsh.Shell`.
 * * Sets the `$jsh` property of the global object to the `inonit.script.jsh.Shell` instance.
 * * Sets an engine-specific host property.
 *     * For Rhino, sets a `$rhino` property which is of type `inonit.script.jsh.Rhino.Interface`.
 *     * For Nashorn, sets a `$nashorn` property which is of type `inonit.script.jsh.Nashorn.Host`.
 * * Runs an engine-specific shell embedding script; for Rhino, runs `jsh/loader/rhino.js`, and for Nashorn, runs `jsh/loader/nashorn.js`.
 *     * Each shell embedding script runs an engine-specific engine embedding script to set up the
 *       {@link slime.runtime.Exports | SLIME runtime object}, which is augmented with Java-specific features; see documentation for
 *       the {@link slime.jrunscript.runtime.Exports | SLIME Java runtime}. The shell embedding script may post-process the result
 *       as well.
 *     * The shell embedding script then adds engine-specific APIs needed by `jsh`.
 *     * The `jsh`-augmented SLIME Java runtime object is sent to the `inonit.script.jsh.Shell`'s `setRuntime()` method so that it
 *       can be obtained from that object.
 * * Runs the `jsh.js` script. This script:
 *     * Receives the `inonit.script.jsh.Shell` object in scope as `$jsh`.
 *     * Retrieves the SLIME runtime created by the shell embedding script, and adds more APIs to it using various properties of the
 *       `inonit.script.jsh.Shell` (`$jsh`) object.
 *     * This runtime is provided to the various plugins that make up the shell; see the documentation on
 *       {@link slime.jsh.plugin | plugins}.
 */
namespace slime.jsh.internal.loader {

}
