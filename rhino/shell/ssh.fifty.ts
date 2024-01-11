//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.ssh {
	export interface Context {
		getEnvArguments: slime.jrunscript.shell.internal.GetEnvArguments
		subprocess: slime.jrunscript.shell.Exports["subprocess"]
	}

	export interface Intention {
		command: slime.jrunscript.shell.run.Intention["command"]
		arguments?: slime.jrunscript.shell.run.Intention["arguments"]
		environment?: slime.jrunscript.shell.environment.Specification
		directory?: slime.jrunscript.shell.run.Intention["directory"]
		stdio?: slime.jrunscript.shell.run.Intention["stdio"]
	}

	export interface Remote {
		user?: string
		hostname: string
	}

	export interface Command {
		client?: string

		remote: Remote

		command: Intention
	}

	export interface File {
		remote?: Remote
		pathname: string
	}

	export interface Copy {
		client?: string

		from: File
		to: File
	}

	type SubprocessMeter = Context["subprocess"]["question"]
	type SubprocessMeans = Context["subprocess"]["action"]

	export interface Exports {
		execute: {
			meter: slime.$api.fp.world.Sensor<
				{
					client?: string

					remote: Remote

					command: Intention
				},
				slime.$api.fp.world.Events<SubprocessMeter>,
				slime.$api.fp.world.Reading<SubprocessMeter>
			>

			intention: (p: slime.$api.fp.world.Subject<Exports["execute"]["meter"]>) => slime.jrunscript.shell.run.Intention
		}
	}

	export interface Exports {
		scp: {
			means: slime.$api.fp.world.Means<
				{
					client?: string

					from: File
					to: File

					stdio?: slime.jrunscript.shell.run.Intention["stdio"]
				},
				slime.$api.fp.world.Events<SubprocessMeans>
			>

			intention: (p: slime.$api.fp.world.Order<Exports["scp"]["means"]>) => slime.jrunscript.shell.run.Intention
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;
			const subject = jsh.shell.ssh;

			fifty.tests.manual = {};

			fifty.tests.manual.execute = function() {
				var pwd: ssh.Intention = {
					command: "pwd",
					stdio: {
						output: "line",
						error: "line"
					}
				};

				var lsL: ssh.Intention = {
					command: "ls",
					arguments: ["-l"],
					stdio: {
						output: "line",
						error: "line"
					}
				};

				var lsEtcLongWithEnvironment: ssh.Intention = {
					command: "ls",
					arguments: ["-l"],
					directory: "/etc",
					environment: {
						set: {
							FOO: "bar"
						}
					},
					stdio: {
						output: "line",
						error: "line"
					}
				};

				var run = function(intention: ssh.Intention) {
					return $api.fp.world.now.question(
						subject.execute.meter,
						{
							remote: {
								user: jsh.shell.environment.SSH_USER || "foo",
								hostname: jsh.shell.environment.SSH_HOSTNAME || "bar"
							},
							command: intention
						},
						{
							//	TODO	use subprocess API
							stderr: jsh.shell.Invocation.handler.stdio.line(function(e) {
								jsh.shell.console("STDERR: " + e.detail.line);
							}),
							stdout: jsh.shell.Invocation.handler.stdio.line(function(e) {
								jsh.shell.console("STDOUT: " + e.detail.line);
							})
						}
					);
				};

				[pwd,lsL,lsEtcLongWithEnvironment].map(run).forEach(function(result) {
					//jsh.shell.console(JSON.stringify(result));
				});

			}

			fifty.tests.manual.scp = function() {
				type copy = {
					from: File,
					to: File
				};

				var local = {
					from: {
						pathname: "/from/local"
					},
					to: {
						remote: {
							user: "user",
							hostname: "hostname"
						},
						pathname: "/to/remote"
					}
				};

				var intention = function(intention: copy) {
					return subject.scp.intention(intention);
					// return $api.fp.world.now.question(
					// 	subject.scp.meter,
					// 	{
					// 		remote: {
					// 			user: jsh.shell.environment.SSH_USER || "foo",
					// 			hostname: jsh.shell.environment.SSH_HOSTNAME || "bar"
					// 		},
					// 		command: intention
					// 	},
					// 	{
					// 		//	TODO	use subprocess API
					// 		stderr: jsh.shell.Invocation.handler.stdio.line(function(e) {
					// 			jsh.shell.console("STDERR: " + e.detail.line);
					// 		}),
					// 		stdout: jsh.shell.Invocation.handler.stdio.line(function(e) {
					// 			jsh.shell.console("STDOUT: " + e.detail.line);
					// 		})
					// 	}
					// );
				};



				[local].map(intention).forEach(function(result) {
					jsh.shell.console(JSON.stringify(result));
				});

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
