//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.lab = fifty.test.Parent();
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace docker.cli {
		interface Invocation {
			command: string[]
			arguments: string[]
		}

		export interface Events {
			stderr: string
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation

			output: {
				/**
				 * Whether the command emits JSON-formatted lines, and hence whether `stdout` should be parsed as lines of JSON
				 * or should be passed as a string.
				 */
				json: boolean

				/**
				 * Whether this *command* *can* be truncated, and hence the `--no-trunc` argument is available to cause it
				 * *not* to be truncated.
				 */
				truncated: boolean
			}

			result: (output: any) => R
		}

		export interface JsonCommand<P,R> {
			invocation: (p: P) => Invocation

			output: {
				json: {
					/**
					 * Whether this command *can* be truncated, and hence the `--no-trunc` argument is available to cause it
					 * *not* to be truncated.
					 */
					truncated: boolean
				}
			}

			map?: (json: any) => R
		}

		export interface StringCommand<P,R = string> {
			invocation: (p: P) => Invocation

			result?: (output: string) => R
		}

		export type AnyCommand = Command<any,any> | JsonCommand<any,any> | StringCommand<any,any>

		export interface Interface {
			exec: (p: {
				interactive: boolean
				tty: boolean
				container: string
				command: string
				arguments: string[]
			}) => Invocation

			shell: (p: Invocation) => slime.jrunscript.shell.invocation.Argument

			command: {
				<I,O>(command: Command<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.impure.Ask<Events, O>
					}
				}

				<I,O>(command: StringCommand<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.impure.Ask<Events, O>
					}
				}

				<I,O>(command: JsonCommand<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.impure.Ask<Events, O[]>
					}
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const containerCreate: StringCommand<{ image: string }> = {
					invocation: function(p) {
						return {
							command: ["container", "create"],
							arguments: [p.image]
						}
					}
				};

				fifty.tests.lab.containerCreateRemove = function() {
					const containerRemove: StringCommand<{ id: string }> = {
						invocation: function(p) {
							return {
								command: ["container", "rm"],
								arguments: [p.id]
							}
						}
					};

					const containerListAll: JsonCommand<void,{ ID: string }> = {
						invocation: () => {
							return {
								command: ["container", "ls"],
								arguments: ["-a"]
							}
						},
						output: {
							json: {
								truncated: true
							}
						}
					};

					var containerExists = function(id: string): boolean {
						return test.subject.engine.cli.command(containerListAll).input().run().some(function(container) {
							return container.ID == id;
						})
					}

					var created = test.subject.engine.cli.command(containerCreate).input({ image: "busybox" }).run({
						stderr: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					fifty.verify(containerExists(created)).is(true);

					var removed = test.subject.engine.cli.command(containerRemove).input({ id: created }).run({
						stderr: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					fifty.verify(containerExists(created)).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace docker {
		export interface Engine {
			cli: cli.Interface

			/**
			 * Determines whether the Docker daemon is running.
			 */
			isRunning: () => boolean

			volume: {
				/**
				 * Copies a file from the host machine, at `from` to the volume specified by `volume` at the
				 * volume-relative path indicated by `path`.
				 */
				copyFileTo: (p: {
					from: string
					volume: string
					path: string
				}) => slime.$api.fp.impure.Tell<cli.Events>

				/**
				 * Runs a command on busybox with the given volume mounted at `/volume`.
				 */
				executeCommandWith: (p: {
					volume: string
					command: string
					arguments?: string[]
				}) => slime.$api.fp.impure.Ask<cli.Events, string>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const containerRun: cli.StringCommand<{
					cidfile?: string
					mounts?: string[]
					image: string
					command: string
					arguments?: string[]
				}> = (
					function() {
						return {
							invocation: function(p) {
								return {
									command: ["container", "run"],
									arguments: $api.Array.build(function(rv) {
										if (p.cidfile) rv.push("--cidfile", p.cidfile);
										if (p.mounts) p.mounts.forEach(function(mount) {
											rv.push("--mount", mount)
										});
										rv.push(p.image);
										rv.push(p.command);
										if (p.arguments) rv.push.apply(rv, p.arguments);
									})
								}
							}
						}
					}
				)();

				const volumeCreate: cli.StringCommand<void> = {
					invocation: function(p) {
						return {
							command: ["volume", "create"],
							arguments: []
						}
					}
				}

				const dumpErrors: $api.events.Handler<cli.Events> = {
					stderr: function(e) {
						jsh.shell.console(e.detail);
					}
				}

				fifty.tests.manual.wip = function() {
					const cli = test.subject.engine.cli;

					const volume = cli.command(volumeCreate).input().run(dumpErrors);

					const ls = function() {
						var result = test.subject.engine.volume.executeCommandWith({
							volume: volume,
							command: "ls",
							arguments: [
								"-l",
								"/volume"
							]
						});
						jsh.shell.console(result());
					}

					//	TODO	Use world-oriented Tell
					test.subject.engine.volume.copyFileTo({
						from: fifty.jsh.file.relative("module.fifty.ts").pathname,
						volume: volume,
						path: "module.fifty.ts"
					});

					ls();

					//	TODO	this command should use shell-based stdout / stderr handling, rather than the standard
					//			Docker CLI swallow-standard-output handling. Need another kind of Command, probably.
					//	TODO	Use world-oriented Ask/Tell
					test.subject.engine.volume.executeCommandWith({
						volume: volume,
						command: "chown",
						arguments: [
							"root:root",
							"/volume/module.fifty.ts"
						]
					});

					ls();
				}
			}
		//@ts-ignore
		)(fifty);

		export namespace install {
			export interface Events {
				installed: slime.jrunscript.file.Directory
				found: slime.jrunscript.file.Directory
			}
		}

		export interface Export {
			engine: slime.jrunscript.tools.docker.Engine
			install: (p: {
				version?: string
				library: {
					shell: slime.jrunscript.shell.Exports
					install: slime.jrunscript.tools.install.Exports
				}
				sudo?: {
					askpass: slime.jrunscript.file.File
				}
				destination: slime.jrunscript.file.Pathname
			}) => slime.$api.fp.impure.Tell<install.Events>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.cli = {};
				fifty.tests.cli.exec = function() {
					var invocation = test.subject.engine.cli.exec({
						interactive: true,
						tty: true,
						container: "CONTAINER",
						command: "COMMAND",
						arguments: [
							"--foo", "bar"
						]
					});
					fifty.verify(invocation).command.evaluate(function(p) { return p.toString(); }).is("exec");
					fifty.verify(invocation).arguments[0].is("--interactive");
					fifty.verify(invocation).arguments[1].is("--tty");
					fifty.verify(invocation).arguments[2].is("CONTAINER");
					fifty.verify(invocation).arguments[3].is("COMMAND");
					fifty.verify(invocation).arguments[4].is("--foo");
					fifty.verify(invocation).arguments[5].is("bar");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace kubectl {
		export interface Program {
			command: string
		}

		export interface Invocation {
			command: string
			subcommand?: string
			type?: string
			name?: string
			flags?: string[]

			directory?: string
			stdio?: Partial<slime.jrunscript.shell.run.StdioConfiguration>
		}

		export interface Installation {
			Environment: {
				create: (p: {
					environment: slime.jrunscript.host.Environment
					directory: string
					stdio: Required<slime.jrunscript.shell.Stdio>
				}) => Environment
			}
		}

		export interface Environment {
			Invocation: {
				create: (p: kubectl.Invocation) => slime.jrunscript.shell.run.Invocation
			}
		}

		export interface Events {
			stderr: slime.jrunscript.shell.run.Line
		}

		export type Result = object

		export interface Exports {
			Installation: (p: kubectl.Program) => kubectl.Installation
			installation: kubectl.Installation

			Invocation: {
				toJson: (p: kubectl.Invocation) => kubectl.Invocation
			}

			result: (world: slime.jrunscript.shell.World, invocation: slime.jrunscript.shell.run.Invocation) => slime.$api.fp.impure.Ask<Events,Result>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.kubectl = function() {
					var installation = docker.test.subject.kubectl.Installation({ command: "/path/to/kubectl" });
					var environment = installation.Environment.create({
						environment: {
							FOO: "bar"
						},
						stdio: fifty.global.jsh.shell.stdio,
						directory: fifty.global.jsh.shell.PWD.toString()
					});
					var invocation = environment.Invocation.create({ command: "config", subcommand: "view" });
					fifty.verify(invocation).configuration.command.is("/path/to/kubectl");
					fifty.verify(invocation).context.environment.evaluate(function(p) { return p.FOO; }).is("bar");
					fifty.verify(invocation).context.environment.evaluate(function(p) { return p.BAR; }).is(void(0));
					fifty.verify(invocation).configuration.arguments.length.is(2);
					fifty.verify(invocation).configuration.arguments[0].is("config");
					fifty.verify(invocation).configuration.arguments[1].is("view");
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace docker {
		export interface Context {
			library: {
				shell: slime.jrunscript.shell.Exports
			}
		}

		export interface Export {
			kubectl: slime.jrunscript.tools.kubectl.Exports
		}

		export type Script = slime.loader.Script<Context,Export>
	}

	export namespace docker.test {
		export const subject: Export = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					shell: fifty.global.jsh.shell
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli.exec);
				if (fifty.global.jsh.shell.PATH.getCommand("docker")) fifty.run(fifty.tests.lab);
				fifty.run(fifty.tests.kubectl);
			}
		}
	//@ts-ignore
	)(fifty);
}
