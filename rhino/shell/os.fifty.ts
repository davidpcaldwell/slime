//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.system {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Process {
		id: number
		parent: number
		command: string
		children: number[]
	}

	export namespace object {
		export interface Process {
			id: number
			parent: Process
			command: string
			children: Process[]
			kill: () => void
		}
	}

	export type ps = () => slime.jrunscript.shell.system.object.Process[]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			var code: slime.jrunscript.shell.internal.os.Script = fifty.$loader.script("os.js");

			var subject = code({
				run: fifty.global.jsh.shell.run,
				os: {
					name: fifty.global.jsh.shell.os.name
				},
				api: {
					js: fifty.global.jsh.js,
					io: fifty.global.jsh.io,
					file: fifty.global.jsh.file
				},
				environment: fifty.global.jsh.shell.environment,
				TMPDIR: fifty.global.jsh.shell.TMPDIR,
				PATH: fifty.global.jsh.shell.PATH,
				replacePath: function(PATH) {
					fifty.global.jsh.shell.PATH = PATH;
				}
			});

			fifty.tests.manual.ps = function() {
				var ps = subject.ps[fifty.global.jsh.shell.os.name];
				fifty.verify(ps,"ps").is.type("function");
				var processes = ps();
				jsh.shell.console(
					processes.map(
						$api.Function.pipe(
							function(process) {
								return {
									id: process.id,
									parent: process.parent.id,
									command: process.command,
									children: process.children.map(function(child) { return child.id })
								}
							},
							$api.Function.JSON.stringify({ space: 4 })
						)
					)
				.join("\n"));
			}
		}
	//@ts-ignore
	)(fifty);


	export type sudo = {
		//	TODO	relate below argument to module run() method
		(p: {
			password: string | (() => string)
			command: string
			arguments?: string[]
			stdio?: any
			evaluate?: any
		}): void

		initialize: (p: string) => void

		PasswordRequired: slime.$api.error.old.Type<"PasswordRequired",{}>
		PasswordIncorrect: slime.$api.error.old.Type<"PasswordIncorrect",{}>

		gui?: (p?: { prompt: string }) => () => string

		desktop?: (p: { askpass: { author: any, prompt: any, force: any }, arguments: any, stdio: any, command: any }) => any
	}
}

namespace slime.jrunscript.shell.internal.os {
	export interface Context {
		run: slime.jrunscript.shell.Exports["run"]
		os: {
			name: string
		}
		api: {
			js: slime.js.old.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
		}
		environment: slime.jrunscript.host.Environment
		TMPDIR: slime.jrunscript.file.Directory
		PATH: slime.jrunscript.file.Searchpath

		//	Um, what is this used for?
		replacePath: (p: slime.jrunscript.file.Searchpath) => void
	}

	export interface Exports {
		ps: {
			[os: string]: slime.jrunscript.shell.system.ps
		}
		sudo: slime.jrunscript.shell.system.sudo
		ping: any
		desktop: (library: slime.jsh.Global["ui"]) => void
	}

	export type Script = slime.loader.Script<Context,Exports>
}
