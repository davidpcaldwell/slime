//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.system {
	export interface Context {
		run: slime.jrunscript.shell.Exports["run"]
		os: {
			name: string
		}
		api: {
			js: slime.runtime.old.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports
		}
		environment: slime.jrunscript.host.Environment
		TMPDIR: slime.jrunscript.file.Directory
		PATH: slime.jrunscript.file.Searchpath

		//	Um, what is this used for?
		replacePath: (p: slime.jrunscript.file.Searchpath) => void
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.world = {};
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
			fifty: slime.fifty.test.kit
		) {
			var code: slime.jrunscript.shell.system.load = fifty.$loader.factory("os.js");

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

			fifty.tests.world.ps = function() {
				var ps = subject.ps[fifty.global.jsh.shell.os.name];
				fifty.verify(ps,"ps").is.type("function");
				var processes = ps();
				fifty.global.jsh.shell.console(processes.map(function(process) {
					return process.toString();
				}).join("\n"));
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

		PasswordRequired: slime.$api.Error.Type<Error>
		PasswordIncorrect: slime.$api.Error.Type<Error>

		gui?: (p?: { prompt: string }) => () => string

		desktop?: (p: { askpass: { author: any, prompt: any, force: any }, arguments: any, stdio: any, command: any }) => any
	}

	export interface Exports {
		ps: {
			[os: string]: ps
		}
		sudo: sudo
		ping: any
		desktop: (library: slime.jsh.Global["ui"]) => void
	}

	export type load = slime.loader.Script<Context,Exports>
}