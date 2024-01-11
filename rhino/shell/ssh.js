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

		/** @type { slime.jrunscript.shell.ssh.Exports["execute"]["intention"] } */
		var command = function(p) {

			/**
			 *
			 * @param { slime.jrunscript.shell.ssh.Intention } p
			 */
			var commands = function(p) {
				var rv = [];
				if (p.directory) {
					rv.push("cd " + p.directory);
				}
				if (p.environment) {
					rv.push((
						[
							"env"
						].concat($context.getEnvArguments(p.environment))
							.concat([p.command])
							.concat(p.arguments)
							.join(" ")
					));
				} else {
					rv.push([
						p.command
					].concat(p.arguments).join(" "));
				}
				return rv;
			}

			return {
				command: p.client || "ssh",
				arguments: $api.Array.build(function(rv) {
					rv.push(login(p.remote));
					rv.push(commands(p.command).join("; "));
				}),
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
		}

		$export({
			execute: {
				intention: command,
				meter: $api.fp.world.Sensor.map({
					sensor: $context.subprocess.question,
					subject: command
				})
			},
			scp: {
				intention: scpCommand,
				means: $api.fp.world.Means.map({
					order: scpCommand,
					means: $context.subprocess.action
				})
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
