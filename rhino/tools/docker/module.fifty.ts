//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools {
	export namespace docker.cli {
		interface Invocation {
			command: string[]
			arguments: string[]
		}

		export interface Events {
			stderr: string
		}

		export interface Interface {
			exec: (p: {
				interactive: boolean
				tty: boolean
				container: string
				command: string
				arguments: string[]
			}) => Invocation

			shell: (p: Invocation) => slime.jrunscript.shell.invocation.Argument

			command: <I,O>(command: Command<I,O>) => {
				input: (i: I) => {
					run: slime.$api.fp.impure.Ask<Events, O>
				}
			}
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation
			output: {
				json: boolean
				truncated: boolean
			}
			result: (json: any) => R
		}
	}

	export namespace docker {
		export interface Engine {
			cli: cli.Interface
		}

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
				fifty: slime.fifty.test.kit
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
				fifty: slime.fifty.test.kit
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
		export const subject: Export = (function(fifty: slime.fifty.test.kit) {
			return fifty.$loader.module("module.js");
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli.exec);
				fifty.run(fifty.tests.kubectl);
			}
		}
	//@ts-ignore
	)(fifty);
}
