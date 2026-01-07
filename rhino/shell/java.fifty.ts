//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.java {
	export interface Context {
		home: slime.$api.fp.impure.Input<slime.jrunscript.file.Directory>
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("java.js");
			return script({
				home: function() { return fifty.global.jsh.shell.java.home; }
			})
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Jdk {
		base: string
	}

	export interface Exports extends Invoke {
		Jdk: {
			from: {
				javaHome: () => Jdk
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.manual.Jdk = function() {
				var jdk = subject.Jdk.from.javaHome();
				jsh.shell.console(jdk.base);
			}
		}
	//@ts-ignore
	)(fifty);

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
