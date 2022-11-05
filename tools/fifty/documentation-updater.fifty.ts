//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.documentation.updater {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			code: slime.project.code.Exports
		}
		typedoc: {
			invocation: slime.jsh.Global["wf"]["typescript"]["typedoc"]["invocation"]
		}
	}

	export namespace internal {
		export type Process = {
			out: () => string
			started: () => number
			kill: () => void
		}

		export type Listener = {
			started: Process
			stdout: {
				out: string
				line: string
			}
			stderr: {
				out: string
				line: string
			}
			finished: Process
			errored: Process
		}

		export type Update = (p: {
			project: slime.jrunscript.file.world.Location
			events: slime.$api.events.Handler<Listener>
		}) => Process
	}

	export interface Updater {
		run: () => void
	}

	export interface Exports {
		Updater: (p: {
			project: string
			events: slime.$api.events.Handler<{
				initialized: {
					project: string
				}
				console: string
				unchanged: void
				updating: {
					out: string
				}
				stdout: {
					out: string
					line: string
				}
				stderr: {
					out: string
					line: string
				}
				finished: {
					out: string
				}
				errored: {
					out: string
				}
			}>
		}) => Updater
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			var script: Script = fifty.$loader.script("documentation-updater.js");
			var subject = script({
				typedoc: {
					invocation: jsh.wf.typescript.typedoc.invocation
				},
				library: {
					file: jsh.file,
					java: jsh.java,
					shell: jsh.shell,
					code: jsh.project.code
				}
			});

			fifty.tests.suite = function() {

			};

			fifty.tests.manual = function() {
				var project = fifty.jsh.file.relative("../..");
				var updater = subject.Updater({
					project: project.pathname,
					events: {
						initialized: function(e) {
							jsh.shell.console("Initialized: project=" + e.detail.project);
						},
						console: function(e) {
							jsh.shell.console(e.detail);
						},
						unchanged: function(e) {
							jsh.shell.console("Checked; no change.");
						},
						updating: function(e) {
							jsh.shell.console("Updating: out=" + e.detail.out);
						},
						stdout: function(e) {
							jsh.shell.console(e.detail.out + " STDOUT: " + e.detail.line);
						},
						stderr: function(e) {
							jsh.shell.console(e.detail.out + " STDERR: " + e.detail.line);
						},
						finished: function(e) {
							jsh.shell.console("Finished updating: was " + e.detail.out);
						},
						errored: function(e) {
							jsh.shell.console("Errored; was to write to " + e.detail.out);
						}
					}
				});
				updater.run();
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
