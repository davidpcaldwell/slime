//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Augments the top-level `jsh.loader` object (with `module`, `file`, `run`, and `value` methods) to accept strings and
 * {@link slime.web.Url} objects.
 */
namespace slime.jsh.script.internal.loader_old {
	export type Context = void

	export type Exports = (plugin: slime.jsh.plugin.Scope["plugin"], jsh: slime.jsh.plugin.Scope["jsh"]) => void

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
