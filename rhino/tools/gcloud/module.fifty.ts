//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.gcloud {
	export namespace cli {
		export interface Invocation {
			command: string
			arguments: string[]
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation
			result?: (json: any) => R
		}

		export type Executor = <P,R>(command: cli.Command<P,R>) => {
			argument: (p: P) => {
				run: slime.$api.fp.world.old.Ask<{
					console: string
				},R>
			}
		}

		export interface Project {
			command: cli.Executor
		}

		export interface Account {
			project: (project: string) => Project
			command: cli.Executor
		}

		export interface Installation {
			account: (account: string) => Account
			command: cli.Executor
		}
	}

	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}
	}

	export interface Exports {
		cli: {
			Installation: {
				at: (pathname: string) => {
					config: (config: string) => {
						account: (account: string) => {
							project: (project: string) => {
								command: cli.Executor
							}
							command: cli.Executor
						}
						command: cli.Executor
					}
					account: (account: string) => {
						project: (project: string) => {
							command: cli.Executor
						}
						command: cli.Executor
					}
					command: cli.Executor
				}

				create: slime.$api.fp.world.Action<string,{
					console: string
				}>
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
			const install = jsh.tools.install;

			var captor = (
				function() {
					var last: shell.run.Invocation;

					return {
						last: function() {
							return last;
						},
						mock: function(invocation: shell.run.Invocation): shell.run.Mock {
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
					_properties: void(0),
					api: {
						js: void(0),
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						document: void(0),
						httpd: void(0),
						xml: void(0)
					},
					kotlin: void(0),
					stdio: {
						output: jsh.shell.stdio.output,
						error: jsh.shell.stdio.error
					},
					run: {
						spi: fixtures.shell.run.createMockWorld(captor.mock)
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

			fifty.tests.Installation = function() {
				var command: cli.Command<string,{}> = {
					invocation: function(argument: string) {
						return {
							command: "foo",
							arguments: [argument]
						}
					}
				}
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

			fifty.tests.manual = {};

			fifty.tests.manual.install = function() {
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
				fifty.run(fifty.tests.Installation);
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
