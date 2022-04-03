//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.hg.install {
	export interface Context {
		api: {
			Error: any
			Events: {
				Function: any
			}
			shell: slime.jsh.Global["shell"]
			install: any
			ui: any
			module: any
		}
	}

	export interface Distribution {
		version: string
		distribution: {
			url: string
			installer?: string
		}
		minor: number
		hg: string
	}

	export interface Exports {
		distribution: {
			osx: (o: {
				os: string
			}) => Distribution
		}
		install: {
			(p: {
				mock: any
			}, listener?: {}) : void
			GUI: any
		}
		installed: any
		installation: any
		Installation: any
	}

	export type Script = slime.loader.Script<Context,Exports>

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { jsh } = fifty.global;

			const module: any = fifty.$loader.module("module.js", {
				api: {
					js: jsh.js,
					time: jsh.time,
					web: jsh.web,
					java: jsh.java,
					ip: jsh.ip,
					file: jsh.file,
					shell: jsh.shell,
					git: jsh.tools.git
				}
			});

			const script: Script = fifty.$loader.script("install.js");
			const subject = script({
				api: {
					Error: jsh.js.Error,
					Events: {
						Function: jsh.tools.install.$api.Events.Function
					},
					shell: jsh.shell,
					install: jsh.tools.install,
					ui: jsh.ui,
					module: module
				}
			});

			fifty.tests.world = {};

			fifty.tests.world.osx = function() {
				jsh.shell.console("os version = " + jsh.shell.os.version);
				var distribution = subject.distribution.osx({
					os: jsh.shell.os.version
				});
				jsh.shell.console(JSON.stringify(distribution,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);

}
