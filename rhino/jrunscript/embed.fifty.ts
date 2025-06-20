//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.bootstrap {
	export interface Context {
		debug: boolean
		script: slime.internal.jrunscript.bootstrap.Configuration["script"]
	}

	//	TODO	obviously external type should not depend on internal one
	export type Exports = slime.internal.jrunscript.bootstrap.Global<{},{}>["$api"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				var code: Script = fifty.$loader.script("embed.js");
				var bootstrap = code({
					debug: void(0),
					script: void(0)
				});
				jsh.shell.console(Object.keys(bootstrap).toString());
				var rhino = bootstrap.engine.rhino.running();
				jsh.shell.console("Rhino context: " + String(rhino));
				if (rhino) jsh.shell.console("Rhino optimization: " + String(rhino.getOptimizationLevel()));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Module<Context,Exports>
}
