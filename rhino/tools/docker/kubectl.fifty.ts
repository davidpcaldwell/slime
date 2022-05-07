//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.kubectl {
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

	export namespace test {
		export const subject = (
			function(
				fifty: slime.fifty.test.Kit
			) {
				var script: slime.jrunscript.tools.docker.internal.kubectl.Script = fifty.$loader.script("kubectl.js");
				return script();
			}
		//@ts-ignore
		)(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.invocation = function() {
				var installation = test.subject.Installation({ command: "/path/to/kubectl" });
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

namespace slime.jrunscript.tools.docker.internal.kubectl {
	export interface Context {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.invocation);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,slime.jrunscript.tools.kubectl.Exports>
}
