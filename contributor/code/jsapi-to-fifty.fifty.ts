//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.jsapi {
	export interface Context {
	}

	export namespace test {
		export const subject = (
			function(fifty: slime.fifty.test.Kit) {
				var script: Script = fifty.$loader.script("jsapi-to-fifty.js");
				var subject = script();
				return subject;
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace fp {
		export type Case<P,R> = (p: P) => slime.$api.fp.Maybe<R>
		export type Switch = <P,R>(...cases: Case<P,R>[]) => (p: P) => slime.$api.fp.Maybe<R>
	}

	export namespace internal {
		export interface InputLine {
			prefix: string
			section: "start" | "middle" | "end"
			content: string
		}

		export interface Block {
			prefix: string
			tokens: string[]
			start: boolean
			end: boolean
		}

		export interface VisibleForTesting {
			prefix: (line: string) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = test.subject;

				fifty.tests.prefix = function() {
					verify(subject).test.prefix("\t\t\t *").is("\t\t\t");
					verify(subject).test.prefix("\t\t\t * dd").is("\t\t\t");

					verify(subject).test.prefix("\t\t\t/**").is("\t\t\t");
					verify(subject).test.prefix("\t\t\t/**  ").is("\t\t\t");

					verify(subject).test.prefix("\t\t\t */").is("\t\t\t");
					verify(subject).test.prefix("\t\t\t */  ").is("\t\t\t");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		test: internal.VisibleForTesting
	}

	export interface Format {
		tabSize: number
		lineLength: number
	}

	export interface Exports {
		comment: (p: Format) => (input: string) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var script: Script = fifty.$loader.script("jsapi-to-fifty.js");
			var subject = script();

			type Case = {
				configuration: Format
				input: string
				expected: string
			}

			function interpret(input: any): Format {
				return input as Format;
			}

			function parseTestData(input: string): Case[] {
				var lines = input.split("\n");
				var state: { format: Format, input: string[], output: string[] } = {
					format: void(0),
					input: void(0),
					output: void(0)
				};
				var rv: Case[] = [];
				var done = false;
				while( !done ) {
					var next = lines.shift();
					if (!state.format) {
						if (!next) {
							done = true;
						} else {
							var json = JSON.parse(next);
							state.format = interpret(json);
							state.input = [];
						}
					} else if (state.input && !state.output) {
						if (next == "===") {
							state.output = [];
						} else {
							state.input.push(next);
						}
					} else {
						if (next == "===") {
							rv.push({
								configuration: state.format,
								input: state.input.join("\n"),
								expected: state.output.join("\n")
							})
							state.format = null;
							state.input = null;
							state.output = null;
						} else {
							state.output.push(next);
						}
					}
				}
				return rv;
			}

			fifty.tests.next = function() {
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty-next.txt").read(String));
				tests.forEach(function(test) {
					var result = subject.comment(test.configuration)(test.input);
					verify(result,"result").is(test.expected);
				});
			}

			fifty.tests.suite = function() {
				//	unit tests
				fifty.run(fifty.tests.prefix);

				//	functional tests
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty.txt").read(String));
				tests.forEach(function(test) {
					var result = subject.comment(test.configuration)(test.input);
					if (result != test.expected) {
						debugger;
					}
					verify(result,"result").is(test.expected);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
