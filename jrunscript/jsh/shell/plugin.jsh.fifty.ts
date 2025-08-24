//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		shell: slime.jsh.shell.Exports
	}
}

/**
 * APIs related to the external operating system environment. Builds on {@link slime.jrunscript.shell}, but provides additional
 * capabilities tied directly to the `jsh` execution environment.
 */
namespace slime.jsh.shell {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.stdio = fifty.test.Parent();

			fifty.tests.stdio.jsapi = fifty.test.Parent();

			(
				function() {
					const test = function(b: boolean) {
						verify(b).is(true);
					};

					const module = fifty.global.jsh.shell;

					fifty.tests.stdio.jsapi._1 = function() {
						test(typeof(module.stdio.output.write) == "function");
						test(typeof(module.stdio.output["close"]) == "undefined");
					}

					fifty.tests.stdio.jsapi._2 = function() {
						test(typeof(module.stdio.error.write) == "function");
						test(typeof(module.stdio.error["close"]) == "undefined");
					}

					const $jsapi = {
						environment: {
							jsh: {
								//	TODO	evidently, this test was designed for built shells. Should figure out whether that was
								//			essential.
								built: {
									home: jsh.shell.jsh.src
								},
								src: jsh.shell.jsh.src
							}
						}
					};

					fifty.tests.stdio.jsapi._3 = function() {
						var NASHORN_DEPRECATION_WARNING = "Warning: Nashorn engine is planned to be removed from a future JDK release";
						var one: { output: string, error: string } = jsh.shell.jsh({
							shell: $jsapi.environment.jsh.built.home,
							script: $jsapi.environment.jsh.src.getFile("rhino/shell/test/stdio.1.jsh.js"),
							stdio: {
								output: String,
								error: String
							},
							evaluate: function(result) {
								return {
									output: result.stdio.output,
									error: result.stdio.error.split("\n").filter(function(line) {
										return line != NASHORN_DEPRECATION_WARNING;
									}).join("\n")
								}
							}
						});
						verify(one).output.is("Hello, World!");
						verify(one).error.is("Hello, tty!");
					}

					const input_abcdefghij = "ABCDEFGHIJ";
					const getScriptOutput = function(p): string {
						return jsh.shell.jsh({
							shell: $jsapi.environment.jsh.built.home,
							script: $jsapi.environment.jsh.src.getFile("rhino/shell/test/" + p.script),
							stdio: {
								input: p.input,
								output: String
							},
							evaluate: function(result) {
								return result.stdio.output;
							}
						})
					};

					fifty.tests.stdio.jsapi._5 = function() {
						var output = getScriptOutput({
							script: "stdio.2.jsh.js",
							input: input_abcdefghij
						});
						verify(output).is(input_abcdefghij);
					}

					fifty.tests.stdio.jsapi._6 = function() {
						var output = getScriptOutput({
							script: "stdio.3.jsh.js",
							input: input_abcdefghij
						});
						verify(output).is(input_abcdefghij);
					}
				}
			)();

			fifty.tests.stdio.close = function() {
				var f = $api.fp.world.mapping(
					jsh.shell.world.question
				);
				var result = f(
					jsh.shell.Invocation.from.argument({
						command: "bash",
						arguments: [
							jsh.shell.jsh.src.getFile("jsh").toString(),
							jsh.shell.jsh.src.getRelativePath("rhino/shell/test/stdio-close.jsh.js").toString()
						],
						stdio: {
							output: "string",
							error: "string"
						}
					})
				);
				verify(result).status.is(0);
				verify(result).stdio.output.evaluate(JSON.parse).evaluate(function(json): boolean { return json.stderr.close; }).is(false);
				verify(result).stdio.error.is(["Hello, World!", "Hello, again!"].join("\n") + "\n");
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.stdio);

				fifty.load("jsh.fifty.ts");
				fifty.load("tsc.fifty.ts");
			}

			fifty.tests.manual = {};

			fifty.tests.manual.kotlin = function() {
				const { jsh } = fifty.global;

				jsh.shell.console("jsh.shell.kotlin = " + jsh.shell.kotlin);
			}
		}
	//@ts-ignore
	)(fifty);
}
