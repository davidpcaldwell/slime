//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides APIs related to Google Cloud Platform.
 */
namespace slime.jrunscript.tools.gcloud {
	export namespace cli {
		export interface Invocation {
			command: string
			arguments?: string[]
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation
			result?: (json: any) => R
		}

		export interface Events {
			console: string
		}

		export type Configuration = <P,R>(command: Command<P,R>) => {
			intention: (p: P) => slime.jrunscript.shell.run.Intention
			handler: (events: slime.$api.event.Producer<Events>) => slime.$api.event.Handlers<slime.jrunscript.shell.run.AskEvents>
			result: (result: slime.jrunscript.shell.run.Exit) => R
		}

		export type Executor = <P,R>(command: cli.Command<P,R>) => slime.$api.fp.world.Sensor<P,cli.Events,R>

		export type OldExecutor = <P,R>(command: cli.Command<P,R>) => {
			argument: (p: P) => {
				run: slime.$api.fp.world.old.Ask<Events,R>
			}
		}

		export interface Project {
			command: cli.OldExecutor
		}

		export interface Account {
			project: (project: string) => Project
			command: cli.OldExecutor
		}

		export interface Installation {
			account: (account: string) => Account
			command: cli.OldExecutor
		}
	}

	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.cli = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Provides APIs related to the `gcloud` command-line tool (including the ability to install it).
		 */
		cli: {
			Installation: {
				/**
				 *
				 * @param pathname A Cloud SDK installation directory.
				 */
				at: (pathname: string) => {
					/**
					 *
					 * @param config The path of the configuration directory to use for this `gcloud` invocation. The
					 * `CLOUDSDK_CONFIG` environment variable is set to this path.
					 */
					config: (config: string) => {
						account: (account: string) => {
							project: (project: string) => {
								command: cli.OldExecutor
							}
							command: cli.OldExecutor
						}
						command: cli.OldExecutor
					}
					account: (account: string) => {
						project: (project: string) => {
							command: cli.OldExecutor
						}
						command: cli.OldExecutor
					}
					command: cli.OldExecutor
				}

				configuration: (pathname: string) => cli.Configuration

				/**
				 * Installs the `gcloud` CLI. Currently only supported on macOS.
				 */
				create: slime.$api.fp.world.Means<string,{
					console: string
				}>
			},
			Configuration: {
				config: (config: string) => $api.fp.Transform<cli.Configuration>
				account: (account: string) => $api.fp.Transform<cli.Configuration>
				project: (project: string) => $api.fp.Transform<cli.Configuration>

				executor: (configuration: cli.Configuration) => cli.Executor
			},
			commands: {
				init: slime.jrunscript.tools.gcloud.cli.Command<void,void>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const script: Script = fifty.$loader.script("module.js");

			var captor = (
				function() {
					var last: shell.run.minus2.Invocation;

					return {
						last: function() {
							return last;
						},
						mock: function(invocation: shell.run.minus2.Invocation): shell.run.Mock {
							last = invocation;
							return {
								exit: {
									status: 0,
									stdio: {
										output: "{}"
									}
								}
							}
						}
					}
				}
			)();

			var code: {
				shell: {
					module: slime.jrunscript.shell.Script
					fixtures: slime.jrunscript.shell.test.Script
				}
			} = {
				shell: {
					module: fifty.$loader.script("../../../rhino/shell/module.js"),
					fixtures: fifty.$loader.script("../../../rhino/shell/fixtures.ts")
				}
			};

			var fixtures = {
				shell: code.shell.fixtures()
			};

			var library = {
				shell: code.shell.module({
					_environment: void(0),
					api: {
						bootstrap: jsh.internal.bootstrap,
						js: jsh.js,
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						document: jsh.js.document,
						xml: void(0)
					},
					kotlin: void(0),
					stdio: {
						output: jsh.shell.stdio.output,
						error: jsh.shell.stdio.error
					},
					world: {
						subprocess: fixtures.shell.run.createMockWorld(captor.mock)
					}
				})
			}

			const subject = script({
				library: {
					file: jsh.file,
					shell: library.shell,
					install: jsh.tools.install
				}
			});

			fifty.tests.exports.cli.Installation = fifty.test.Parent();

			var command: cli.Command<string,{}> = {
				invocation: function(argument: string) {
					return {
						command: "foo",
						arguments: [argument]
					}
				}
			}

			fifty.tests.exports.cli.Installation.old = function() {
				subject.cli.Installation.at(
					"/gcloud/at"
				).config(
					"config"
				).account(
					"account"
				).project(
					"project"
				).command(
					command
				).argument("bar").run();

				verify(captor).last().context.environment.CLOUDSDK_CONFIG.is("config");
				verify(captor).last().configuration.command.is("/gcloud/at/bin/gcloud");
				verify(captor).last().configuration.arguments[0].is("--account");
				verify(captor).last().configuration.arguments[1].is("account");
				verify(captor).last().configuration.arguments[2].is("--project");
				verify(captor).last().configuration.arguments[3].is("project");
				verify(captor).last().configuration.arguments[4].is("--format");
				verify(captor).last().configuration.arguments[5].is("json");
				verify(captor).last().configuration.arguments[6].is("foo");
				verify(captor).last().configuration.arguments[7].is("bar");
			}

			fifty.tests.exports.cli.Installation.configuration = function() {
				var getIntention = function(configuration: cli.Configuration) {
					return configuration(command).intention("bar");
				}

				var configuration = subject.cli.Installation.configuration("/gcloud/at");
				verify(getIntention(configuration),"intention", function(it) {
					it.arguments[0].is("--format");
					it.arguments[1].is("json");
					it.arguments[2].is("foo");
					it.arguments[3].is("bar");
				});

				var withAccount = subject.cli.Configuration.account("ACCOUNT")(configuration);
				verify(getIntention(withAccount),"intention", function(it) {
					it.arguments[0].is("--account");
					it.arguments[1].is("ACCOUNT");
					it.arguments[2].is("--format");
					it.arguments[3].is("json");
					it.arguments[4].is("foo");
					it.arguments[5].is("bar");
				});

				var withConfig = subject.cli.Configuration.config("/gcloud/config")(configuration);
				verify(getIntention(withConfig),"intention", function(it) {
					debugger;
					var environment = it.environment({});
					jsh.shell.console(JSON.stringify(environment));
					verify(environment).evaluate(function(value) { return value.CLOUDSDK_CONFIG; }).is("/gcloud/config");
				});

				var withProject = subject.cli.Configuration.project("PROJECT")(withAccount);
				verify(getIntention(withProject),"intention", function(it) {
					it.arguments[0].is("--project");
					it.arguments[1].is("PROJECT");
					it.arguments[2].is("--account");
					it.arguments[3].is("ACCOUNT");
					it.arguments[4].is("--format");
					it.arguments[5].is("json");
					it.arguments[6].is("foo");
					it.arguments[7].is("bar");
				});
			}

			fifty.tests.manual = {};
			fifty.tests.manual.cli = {};
			fifty.tests.manual.cli.Installation = {};
			fifty.tests.manual.cli.Installation.create = function() {
				const module = script({
					library: {
						file: jsh.file,
						shell: jsh.shell,
						install: jsh.tools.install
					}
				});
				var at = fifty.jsh.file.temporary.location();
				$api.fp.world.now.action(
					module.cli.Installation.create,
					at.pathname,
					{
						console: function(e) {
							jsh.shell.console(e.detail);
						}
					}
				);
				jsh.shell.console("Installed to: " + at.pathname);
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.jsh {
	export interface Tools {
		gcloud: slime.jrunscript.tools.gcloud.Exports
	}
}
