//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.script.old.application {
	export interface Context {
		getopts: slime.jsh.script.Exports["getopts"]
	}

	export type Descriptor = any

	export interface Application {
		/**
		 * @experimental
		 *
		 * @returns
		 */
		getCommands: () => any
		run: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const script: Script = fifty.$loader.script("Application.js");
			const Application = script({
				getopts: jsh.script.getopts
			});

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.commands = function() {
				var one = new Application(new function() {
					this.options = {};
					this.commands = {};
					this.commands.a = {
						getopts: {
						},
						run: function() {
						}
					};
					this.commands.a.b = {
						getopts: {},
						run: function() {
						}
					}
				});

				var commands = one.getCommands();
				verify(commands).evaluate.property("a").is.not(void(0));
				verify(commands).evaluate.property("a.b").is.not(void(0));
				verify(commands).evaluate.property("b").is(void(0));
			}

			fifty.tests.jsapi._1 = function() {
				const test = function(b: boolean) {
					verify(b).is(true);
				}

				var returnParsedArguments = function() {
					return jsh.js.Object.set({}, {
						target: this
					}, arguments[0]);
				};

				var one = new Application({
					property: "value",
					options: {
						global: String,
						gboolean: false
					},
					commands: {
						doIt: {
							getopts: {
								options: {
									local: Number
								}
							},
							run: returnParsedArguments
						}
					}
				});

				var oneAnswer = one.run("-gboolean", "-global", "globalValue", "doIt", "-local", "4");
				test(oneAnswer.global.gboolean);
				test(oneAnswer.global.global === "globalValue");
				test(oneAnswer.options.local === 4);

				//	Tests undocumented feature
				test(oneAnswer.target.property === "value");
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * Creates a top-level application that can have multiple *commands*, each of which have their own arguments, as well as global
	 * arguments that apply to all commands.
	 *
	 * @param o Describes tha application.
	 */
	export type Constructor = new (o: Descriptor) => Application

	export type Exports = Constructor

	export type Script = slime.loader.Script<Context,Exports>
}
