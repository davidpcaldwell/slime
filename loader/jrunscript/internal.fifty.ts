//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The `jrunscript` SLIME runtime supports two engine-specific embeddings.
 *
 * Generally speaking, an engine-specific script is executed which is provided with the `$loader` property of
 * {@link slime.jrunscript.runtime.Scope} and then provides the `$javahost` and `$bridge` property implementations
 * for that engine, passing all three values through to the `expression.js` script.
 *
 * The SLIME Java runtime comes with two engine embeddings: one for the Rhino JavaScript engine provided by Mozilla, and one for the
 * Nashorn engine included with Java 8-14 (and available as a standalone library for Java 15 and up). The engine embeddings are
 * expressions that evaluate to an object. They provide different scope variables for implementing the embedding;
 * {@link slime.jrunscript.runtime.internal.rhino.Scope} for Rhino, and {@link slime.jrunscript.runtime.internal.nashorn.Scope} for
 * Nashorn.
 *
 * For each engine, two embeddings are included: a servlet-based embedding and an embedding that supports
 * `jsh`.
 *
 * If the underlying engine is Rhino, the {@link slime.runtime.Engine} implementation's `debugger` property is implemented in
 * terms of the Rhino debugger.
 *
 */
namespace slime.jrunscript.runtime.internal {
}
