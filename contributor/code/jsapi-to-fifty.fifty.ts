//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.jsapi {
	export interface Context {
		library: {
			document: slime.runtime.document.Exports
		}
	}

	export namespace test {
		export const { subject, wip } = (
			function(fifty: slime.fifty.test.Kit) {
				var script: Script = fifty.$loader.script("jsapi-to-fifty.js");
				var code: { document: slime.runtime.document.Script } = {
					document: fifty.$loader.script("../../loader/document/module.js")
				}
				var library = {
					document: code.document(
						fifty.global.jsh ? { $slime: fifty.global.jsh.unit.$slime } : {}
					)
				};
				var subject = script({
					library: library
				});
				var wip = script({
					library: library
				})
				return { subject, wip };
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace fp {
		export type Case<P,R> = (p: P) => slime.$api.fp.Maybe<R>
		export type Switch = <P,R>(...cases: Case<P,R>[]) => (p: P) => slime.$api.fp.Maybe<R>
		export type ToPartial = <P,R>(f: slime.$api.fp.Mapping<P,R>) => slime.$api.fp.Partial<P,R>
	}

	export namespace internal {
		/**
		 * A single line of comment data, including an optional prefix
		 */
		export interface InputLine {
			indent: slime.$api.fp.Maybe<string>
			section: "start" | "middle" | "end"
			content: string
		}

		/**
		 * A multiline section of a comment, including an indent, whether the section has the first or last line of a comment,
		 * and a set of tokens that represent the comment's content.
		 */
		export interface Block {
			/** The indent to use. */
			indent: string

			/** Whether the start of this content is the start of a comment. */
			hasStart: boolean

			/** Whether the end of this content is the end of a comment. */
			hasEnd: boolean

			tokens: string[]
		}

		export interface VisibleForTesting {
			maybeify: fp.ToPartial
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.maybeify = function() {
					var divideByTwoEvenly = function(n: number): number {
						if (n % 2 == 0) return n / 2;
					}

					var maybeDivideByTwo = test.subject.test.maybeify(divideByTwoEvenly);

					var forThree = maybeDivideByTwo(3);
					verify(forThree).present.is(false);
					var forThree = maybeDivideByTwo(4);
					verify(forThree).present.is(true);
					if (forThree.present) verify(forThree).value.is(2);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface VisibleForTesting {
			prefix: (line: string) => slime.$api.fp.Maybe<string>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = test.subject;

				fifty.tests.prefix = function() {
					const assert = function(m: slime.$api.fp.Maybe<string>): string {
						if (m.present) return m.value;
						return null;
					};

					verify(subject).test.prefix("\t\t\t *").evaluate(assert).is("\t\t\t");
					verify(subject).test.prefix("\t\t\t * dd").evaluate(assert).is("\t\t\t");

					verify(subject).test.prefix("\t\t\t/**").evaluate(assert).is("\t\t\t");
					verify(subject).test.prefix("\t\t\t/**  ").evaluate(assert).is("\t\t\t");

					verify(subject).test.prefix("\t\t\t */").evaluate(assert).is("\t\t\t");
					verify(subject).test.prefix("\t\t\t */  ").evaluate(assert).is("\t\t\t");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface VisibleForTesting {
			split: <P,R1,R2>(fs: [(p: P) => R1, (p: P) => R2]) => (p: P) => [R1, R2]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const subject = test.subject;

				fifty.tests.split = function() {
					var double = function(n: number) { return n*2; };
					var stringify = function(n: number) { return String(n); };
					var both = test.subject.test.split([double, stringify]);

					var answer = both(2);
					verify(answer).length.is(2);
					verify(answer)[0].is(4);
					verify(answer)[1].is("2");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface VisibleForTesting {
			html: slime.runtime.document.Exports["Fragment"]["codec"]["string"]["decode"]
		}

		export interface VisibleForTesting {
			library: {
				document: slime.runtime.document.Exports
			}
		}

		export interface VisibleForTesting {
			parseBlocks: (string: string) => Block[]
		}

		export interface VisibleForTesting {
			formatBlockUsing: (format: Format) => (block: Block) => string[]
			wip: Exports["comment"]
		}
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
			const { $api } = fifty.global;

			var subject = test.subject;

			type Case = {
				configuration: Format
				input: string
				expected: string
			}

			function interpret(input: any): Format {
				return input as Format;
			}

			/**
			 * Parses test cases from a text file. The first line of a test case is a JSON string that evaluates to a
			 * {@link Format}. Following lines are added to the input for the test case until a `===` line is reached; the trailing
			 * newline is *not* added to the input. Lines after the `===` are interpreted as output, again until a `===`, and again
			 * not including the trailing newline before that `===`.
			 *
			 * @param input A file containing formatted test cases
			 * @returns
			 */
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

			var functionalTests = function(subject: Exports, tests: Case[]) {
				tests.forEach(function(test) {
					var result = subject.comment(test.configuration)(test.input);
					if (result != test.expected) {
						debugger;
					}
					verify(result,"result").is(test.expected);
				});
			}

			fifty.tests.suite = function() {
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty.txt").read(String));

				//	unit tests
				fifty.run(fifty.tests.prefix);
				fifty.run(fifty.tests.split);

				//	functional tests
				functionalTests(subject, tests);
			}

			fifty.tests.next = function() {
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty-next.txt").read(String));
				functionalTests(subject, tests);
			}

			fifty.tests.wip = function() {
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty-next.txt").read(String));
				functionalTests(test.wip, [ tests[0] ]);
			}

			fifty.tests.wip.suite = function() {
				var tests = parseTestData(fifty.$loader.get("test/jsapi-to-fifty.txt").read(String));
				functionalTests(test.wip, tests);
				fifty.run(fifty.tests.wip);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
