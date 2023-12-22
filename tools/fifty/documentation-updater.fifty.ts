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
			/** The directory to which this process will be writing. */
			out: () => string

			/** The timestamp of the time at which ths process started. */
			started: () => number

			/** A method that will kill the process. */
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

		/**
		 * An internal function that implements a means for executing updates for TypeDoc. The documentation will be written to an
		 * arbitrary temporary directory. The {@link Listener} has the ability to receive a callback with its `started` event that
		 * gives access to an object representing the running update, including the output directory to which its output will be
		 * written.
		 *
		 * This method terminates when the update process terminates, after firing either a `finished` or a `processed` event,
		 * both of which also give access to the output directory to which TypeDoc documentation would have been written.
		 */
		export type Update = slime.$api.fp.world.Means<
			{
				project: slime.jrunscript.file.Location
			},
			Listener
		>
	}

	export interface Exports {
		test: {
			Update: internal.Update
		}
	}

	export interface Updater {
		/**
		 * Executes the `Updater` process until the `stop` method is called. Repeatedly checks the timestamps of the code and
		 * documentation to decide whether to run TypeDoc.
		 */
		run: () => void

		/**
		 * Resets the interval for checking the code against the generated documentation to the minimum. Should be used by the
		 * caller to hint that the code has changed.
		 */
		update: () => void

		stop: () => void
	}

	export interface Exports {
		/**
		 * An object creating a stateful `Updater` that will update the TypeDoc for a given project. The given `Handlers` will be
		 * attached to the running Updater, and will not be disconnected until the `Updater` is stopped via its `stop()` method.
		 *
		 * @param p
		 * @returns
		 */
		Updater: (p: {
			project: string
			events: slime.$api.event.Handlers<{
				initialized: {
					project: string
				}
				creating: void
				unchanged: {
					code: number
					documentation: number
				}
				setInterval: number
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
				stopping: {
					out: string
				}
				finished: {
					out: string
				}
				errored: {
					out: string
				}
				destroying: void
				destroyed: void
			}>
		}) => Updater
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

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

			//var slime = fifty.jsh.file.relative("../..");
			var project = jsh.shell.PWD.pathname.toString();

			var timed = function<F extends (...args: any[]) => any>(f: F, callback: (elapsed: number) => void): F {
				return function() {
					var start = new Date();
					var rv = f.apply(this,arguments);
					var end = new Date();
					callback(end.getTime() - start.getTime());
					return rv;
				} as F;
			}

			fifty.tests.manual = {};

			fifty.tests.manual.update = function() {
				var update = subject.test.Update({
					project: jsh.file.Location.from.os(project)
				});
				$api.fp.world.now.tell(
					update,
					{
						started: function(e) {
							jsh.shell.console("Started: " + JSON.stringify(e.detail));
						},
						stderr: function(e) {
							jsh.shell.console("STDERR (" + e.detail.out + "): " + e.detail.line);
						},
						stdout: function(e) {
							jsh.shell.console("STDOUT (" + e.detail.out + "): " + e.detail.line);
						},
						finished: function(e) {
							jsh.shell.console("Finished: " + JSON.stringify(e.detail));
						},
						errored: function(e) {
							jsh.shell.console("Finished: " + JSON.stringify(e.detail));
						}
					}
				);
			}

			var createUpdater = function() {
				return subject.Updater({
					project: project,
					events: {
						initialized: function(e) {
							jsh.shell.console("Initialized: project=" + e.detail.project);
						},
						creating: function(e) {
							jsh.shell.console("Creating documentation ...");
						},
						setInterval: function(e) {
							jsh.shell.console("Set interval to " + e.detail + " milliseconds.");
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
						stopping: function(e) {
							jsh.shell.console("Stopping: " + e.detail.out + " ...");
						},
						finished: function(e) {
							jsh.shell.console("Finished updating: was " + e.detail.out);
						},
						errored: function(e) {
							jsh.shell.console("Errored; was to write to " + e.detail.out);
						},
						destroying: function(e) {
							jsh.shell.console("Destroying ...");
						},
						destroyed: function(e) {
							jsh.shell.console("Destroyed.");
						}
					}
				});
			}

			fifty.tests.manual.run = function() {
				var updater = createUpdater();
				updater.run();
			};

			fifty.tests.manual.stop = function() {
				var updater = createUpdater();
				jsh.java.Thread.start(function() {
					jsh.java.Thread.sleep(45000);
					updater.stop();
				})
				updater.run();
			}

			fifty.tests.manual.timing = {};

			fifty.tests.manual.timing.typedoc = function() {
				timed(
					function() {
						$api.fp.world.now.action(
							subject.test.Update,
							{
								project: jsh.file.Location.from.os(project)
							},
							{
								started: function(e) {
									jsh.shell.console("Started: " + JSON.stringify(e.detail));
								},
								stdout: function(e) {
									jsh.shell.console("STDOUT: " + e.detail.line);
								},
								stderr: function(e) {
									jsh.shell.console("STDERR: " + e.detail.line);
								},
								finished: function(e) {
									jsh.shell.console("Finished: " + JSON.stringify(e.detail));
								},
								errored: function(e) {
									jsh.shell.console("Errored: " + JSON.stringify(e.detail));
								}
							}
						)
					},
					function(elapsed) {
						jsh.shell.console("TypeDoc took " + (elapsed / 1000).toFixed(3) + " seconds.");
					}
				)();
			}

			fifty.tests.manual.timing.scans = function() {
				var git = timed(jsh.project.code.git.lastModified, function(elapsed) {
					jsh.shell.console("git took " + elapsed + " milliseconds");
				})({ base: project });

				var documentation = timed(function() {
					var loader = jsh.file.Location.directory.loader.synchronous({
						root: $api.fp.now.invoke(project, jsh.file.Location.from.os, jsh.file.Location.directory.relativePath("local/doc/typedoc"))
					});
					return jsh.project.code.directory.lastModified({
						loader: loader,
						map: $api.fp.identity
					})
				}, function(elapsed) {
					jsh.shell.console("documentation scan took " + elapsed + " milliseconds");
				})();
			};
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
