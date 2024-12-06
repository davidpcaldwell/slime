//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Creates the `Application` implementation.
 */
namespace slime.jsh.script.old.application {
	export interface Context {
		getopts: slime.jsh.script.Exports["getopts"]
	}

	/**
	 * Describes an individual command in this application.
	 */
	export interface Command {
		//	TODO	should supply an empty default
		/**
		 * Interpreted as an argument to the `getopts` method of {@link slime.jsh.script.Exports | this module}.
		 */
		getopts: Parameters<slime.jsh.script.GetoptsFunction>[0]

		/**
		 * Implements a particular command in this application.
		 * @param p The result of the getopts() call for this command. The result will have an additional property `global`
		 * containing the global options passed to the application.
		 * @returns A "result" of the command that can be used by the caller.
		 */
		run: (
			p: (
				ReturnType<slime.jsh.script.GetoptsFunction>
				& { global: object }
			)
		) => any
	}

	export type Commands = {
		[name: string]: Command
	}

	/**
	 * Describes an application.
	 */
	export interface Descriptor {
		//	TODO	undocumented feature of some kind; see test
		property?: any

		/**
		 * Interpreted as the `options` property of an argument to the
		 * `getopts()` method of {@link slime.jsh.script.Exports | this module}.
		 */
		options?: Parameters<slime.jsh.script.GetoptsFunction>[0]["options"]

		//	TODO	What if the property is not of type command?
		/**
		 * Generally, an object whose properties are command names and whose values are {@link Command}s.
		 *
		 * However, the object may contain nested commands. For example, if it has a `foo` property with a `bar` property, a
		 * `foo.bar` command will be created using the property.
		 */
		commands: {
			[name: string]: Commands | Command
		}
	}

	export interface Application {
		/**
		 * @experimental
		 */
		getCommands: () => { [name: string]: slime.jsh.script.old.application.Command }

		/**
		 * Executes the application.
		 *
		 * The application arguments are interpreted as follows:
		 *
		 * * Global arguments are interpreted,
		 * * The first token that is not a global argument is interpreted as the <i>command</i> to run,
		 * * All other arguments are interpreted as arguments to that command.
		 *
		 * @param args The list of string arguments to pass to the application.
		 *
		 * @return The value returned by the command that is executed.
		 */
		run: (...args: string[]) => any
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
