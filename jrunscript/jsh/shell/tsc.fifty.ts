//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell.internal.tsc {
	export interface Context {
		tsc: string
		node: string

		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Exports {
		/**
		 * Compiles TypeScript to ES5, non-strict JavaScript for the supported shell engines.
		 * Type-only module exports are removed so the result can be evaluated as a SLIME script.
		 */
		compile: (code: string) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				const { jsh } = fifty.global;
				const script: Script = fifty.$loader.script("tsc.js");
				const subject = script({
					node: jsh.shell.jsh.lib.getRelativePath("node").toString(),
					tsc: jsh.shell.jsh.lib.getRelativePath("node/bin/tsc").toString(),
					library: { file: jsh.file, shell: jsh.shell }
				});
				const compiled = subject.compile("export interface Value { value: number }; const value: number = 1;");
				fifty.verify(compiled.indexOf("var value = 1;") >= 0).is(true);
				fifty.verify(compiled.indexOf('"use strict"') < 0).is(true);
				fifty.verify(/^export \{\};/m.test(compiled)).is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
}
