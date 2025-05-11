//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.ssh.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.ssh.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.shell.ssh.Remote } p
		 */
		var login = function(p) {
			return (p.user) ? (p.user + "@" + p.hostname) : p.hostname;
		};

		/**
		 *
		 * @param { slime.jrunscript.shell.ssh.Intention } p
		 */
		var intentionToCommand = function(p) {
			var rv = [];
			if (p.directory) {
				rv.push("cd " + p.directory);
			}
			if (p.environment) {
				rv.push((
					[
						"env"
					].concat($context.library.getEnvArguments(p.environment))
						.concat([p.command])
						.concat(p.arguments)
						.join(" ")
				));
			} else {
				rv.push([
					p.command
				].concat(p.arguments).join(" "));
			}
			return rv.join("; ");
		}

		/** @type { (p: slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["execute"]["sensor"]>) => slime.jrunscript.shell.run.Intention } */
		var toShellIntention = function(p) {
			return {
				command: p.client || "ssh",
				arguments: $api.Array.build(function(rv) {
					rv.push(login(p.remote));
					rv.push(p.command);
				}),
				stdio: p.stdio
			}
		};

		/** @type { slime.$api.fp.Mapping<slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["execute"]["intention"]>,slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["execute"]["sensor"]>> } */
		var intentionToSubject = function(p) {
			return {
				client: p.client,
				remote: p.remote,
				command: intentionToCommand(p.command),
				stdio: p.command.stdio
			}
		};

		/** @type { slime.$api.fp.Mapping<slime.jrunscript.shell.ssh.File,string> } */
		var toScpArgument = function(file) {
			if (file.remote) {
				return login(file.remote) + ":" + file.pathname;
			} else {
				return file.pathname;
			}
		};

		/** @type { slime.jrunscript.shell.ssh.Exports["scp"]["intention"] } */
		var scpCommand = function(p) {
			return {
				command: p.client || "scp",
				arguments: $api.Array.build(function(rv) {
					rv.push(toScpArgument(p.from));
					rv.push(toScpArgument(p.to));
				}),
				stdio: p.stdio
			};
		};

		/** @type { slime.$api.fp.Mapping<slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["file"]["exists"]["sensor"]>,slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["execute"]["sensor"]>> } */
		var fileExistsToSubject = function(p) {
			return {
				client: p.client,
				remote: p.remote,
				command: "[ -f " + p.pathname + " ]",
				stdio: p.stdio
			}
		}

		/** @type { slime.$api.fp.Mapping<slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["file"]["exists"]["sensor"]>,slime.$api.fp.world.Subject<slime.jrunscript.shell.ssh.Exports["execute"]["sensor"]>> } */
		var fileReadToSubject = function(p) {
			return {
				client: p.client,
				remote: p.remote,
				command: "cat " + p.pathname,
				stdio: {
					output: "string",
					error: p.stdio.error
				}
			}
		}

		$export({
			execute: {
				sensor: $api.fp.world.Sensor.map({
					sensor: $context.world.subprocess.question,
					subject: toShellIntention
				}),
				intention: $api.fp.world.Sensor.map({
					sensor: $context.world.subprocess.question,
					subject: $api.fp.pipe(
						intentionToSubject,
						toShellIntention
					)
				}),
				test: {
					intention: $api.fp.pipe(
						intentionToSubject,
						toShellIntention
					)
				},
			},
			file: {
				exists: (function() {
					var sensor = $api.fp.world.Sensor.map({
						sensor: $context.world.subprocess.question,
						subject: $api.fp.pipe(
							fileExistsToSubject,
							toShellIntention
						),
						reading: function(exit) {
							return exit.status == 0;
						}
					});
					return {
						sensor: sensor,
						basic: $api.fp.world.Sensor.old.mapping({
							sensor: sensor
						})
					}
				})(),
				read: (function() {
					var sensor = $api.fp.world.Sensor.map({
						sensor: $context.world.subprocess.question,
						subject: $api.fp.pipe(
							fileReadToSubject,
							toShellIntention
						),
						reading: function(exit) {
							//	TODO	error handling
							return $api.fp.Maybe.from.some(exit.stdio.output);
						}
					});

					return {
						sensor: sensor,
						assert: $api.fp.Partial.impure.old.exception({
							try: $api.fp.world.Sensor.old.mapping({
								sensor: sensor
							}),
							//	TODO	diagnostics
							nothing: function(request) { throw new Error("Could not read."); }
						})
					}
				})()
			},
			scp: {
				intention: scpCommand,
				means: $api.fp.world.Means.map({
					order: scpCommand,
					means: $context.world.subprocess.action
				})
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
