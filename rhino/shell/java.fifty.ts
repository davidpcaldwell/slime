//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.java {
	export interface Context {
		getJrunscriptPathFromJdk: (home: string) => slime.$api.fp.Maybe<string>

		home: slime.$api.fp.impure.Input<slime.jrunscript.file.Directory>
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("java.js");
			return script({
				getJrunscriptPathFromJdk: fifty.global.$api.TODO(),
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

	export type JdkFromBaseError = (
		| {
			type: "empty-base"
			missing: "null" | "undefined" | "empty-string"
		}
	)

	export interface Exports extends Invoke {
		Jdk: {
			from: {
				base: (base: string) => slime.$api.fp.Result<JdkFromBaseError,Jdk>

				/**
				 * Returns a Jdk object based on the value of the `java.home` property.
				 */
				javaHome: () => Jdk
			}

			jrunscript: (jdk: Jdk) => slime.$api.fp.Maybe<string>
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
			const { verify } = fifty;
			const { $api } = fifty.global;
			const { subject } = test;

			var asAny: slime.js.Cast<any> = $api.fp.cast.unsafe;

			fifty.tests.suite = function() {
				var fromEmpty = subject.Jdk.from.base("");
				verify(fromEmpty).evaluate.property("ok").is(false);
				if ("error" in fromEmpty) {
					verify(fromEmpty.error.type).is("empty-base");
					verify(fromEmpty.error.missing).is("empty-string");
				}

				var fromNull = subject.Jdk.from.base(asAny(null));
				verify(fromNull).evaluate.property("ok").is(false);
				if ("error" in fromNull) {
					verify(fromNull.error.type).is("empty-base");
					verify(fromNull.error.missing).is("null");
				}

				var fromUndefined = subject.Jdk.from.base(asAny(void(0)));
				verify(fromUndefined).evaluate.property("ok").is(false);
				if ("error" in fromUndefined) {
					verify(fromUndefined.error.type).is("empty-base");
					verify(fromUndefined.error.missing).is("undefined");
				}

				verify(3).evaluate(function(value) {
					subject.Jdk.from.base(asAny(value));
				}).threw.type(TypeError);

				var normalized = subject.Jdk.from.base("  /jdk/home  ");
				verify(normalized).evaluate.property("ok").is(true);
				if ("value" in normalized) verify(normalized.value.base).is("/jdk/home");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
}
