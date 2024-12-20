//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install.downloads {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}

		getFilenameMimeType: slime.$api.fp.Partial<string,slime.mime.Type>
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("downloads.js");
			return script({
				library: {
					file: fifty.global.jsh.file
				},
				getFilenameMimeType: function(name) {
					if (/\.txt$/.test(name)) return fifty.global.$api.fp.Maybe.from.some(
						fifty.global.$api.mime.Type.codec.declaration.decode("text/plain")
					);
					return fifty.global.$api.fp.Maybe.from.nothing();
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface Download {
		read: () => slime.jrunscript.runtime.io.InputStream
		type: slime.$api.fp.Maybe<slime.mime.Type>
	}

	export type Cache = (name: string) => slime.$api.fp.impure.input.Store<Download>;

	export interface Exports {
		directory: (directory: slime.jrunscript.file.Location) => Cache
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			type Invocation<F extends slime.external.lib.es5.Function> = {
				target: ThisParameterType<F>
				arguments: Parameters<F>
				returned: ReturnType<F>
			};

			fifty.tests.suite = function() {
				var tmp = fifty.jsh.file.temporary.location();
				var cache = subject.directory(tmp);
				const name = "it.txt";

				const fetch = function(): Download {
					return {
						read: () => jsh.io.InputStream.from.string("Hello, World!"),
						type: $api.fp.Maybe.from.some($api.mime.Type.codec.declaration.decode("text/plain"))
					};
				};

				//	TODO	add to Fifty proper
				var spy = function<F extends slime.external.lib.es5.Function>(f: F): { invoke: F, recorded: Invocation<F>[] } {
					var recorded: Invocation<F>[] = [];
					return {
						invoke: function() {
							const target: Invocation<F>["target"] = this;
							const args: Invocation<F>["arguments"] = Array.prototype.slice.call(arguments);
							var rv = f.apply(this, arguments);
							recorded.push({ target, arguments: args, returned: rv });
							return rv;
						} as F,
						recorded: recorded
					};
				};

				const watched = spy(fetch);

				const store = cache(name);

				const get = $api.fp.impure.Input.cache(store)(watched.invoke);

				const watched2 = spy(get);

				verify(watched, "fetch").recorded.length.is(0);
				verify(watched2, "get").recorded.length.is(0);

				const yesType = function(v: Download) {
					if (!v.type.present) throw new Error();
					return v.type.value;
				}

				debugger;
				const first = watched2.invoke();
				verify(first).read().character().asString().is("Hello, World!");
				verify(first).evaluate(yesType).media.is("text");
				verify(first).evaluate(yesType).subtype.is("plain");
				verify(watched, "fetch").recorded.length.is(1);
				verify(watched2, "get").recorded.length.is(1);

				const second = watched2.invoke();
				verify(second).read().character().asString().is("Hello, World!");
				verify(second).evaluate(yesType).media.is("text");
				verify(second).evaluate(yesType).subtype.is("plain");
				verify(watched, "fetch").recorded.length.is(1);
				verify(watched2, "get").recorded.length.is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
