//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.kubernetes.cli {
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
				environment: slime.jrunscript.java.Environment
				directory: string
				stdio: Required<slime.jrunscript.shell.parent.Stdio>
			}) => Environment
		}
	}

	export interface Environment {
		Invocation: {
			create: (p: cli.Invocation) => slime.jrunscript.shell.run.minus2.Invocation
		}
	}

	export interface Events {
		stderr: slime.jrunscript.shell.run.Line
	}

	export type Result = object

	export interface Exports {
		Installation: (p: cli.Program) => cli.Installation
		installation: cli.Installation

		Invocation: {
			toJson: (p: cli.Invocation) => cli.Invocation
		}

		result: (world: slime.jrunscript.shell.Exports["world"], invocation: slime.jrunscript.shell.run.minus2.Invocation) => slime.$api.fp.world.old.Ask<Events,Result>
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.wip = function() {
				var getPods: Invocation = {
					command: "get",
					type: "pods",
					flags: [
						"--context", jsh.shell.environment.SLIME_TEST_KUBECTL_CONTEXT,
						"--namespace", jsh.shell.environment.SLIME_TEST_KUBECTL_NAMESPACE
					]
				};

				var ask = jsh.tools.kubectl.json(getPods);

				var result = ask();

				jsh.shell.console(JSON.stringify(result));
			}
		}
	//@ts-ignore
	)(fifty);

}

namespace slime.jrunscript.tools.docker.internal.kubectl {
	export type Context = void

	export type Script = slime.loader.Script<Context,slime.jrunscript.tools.kubernetes.cli.Exports>
}
