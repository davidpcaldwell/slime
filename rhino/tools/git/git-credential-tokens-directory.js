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
	 * @param { slime.jrunscript.tools.git.credentials.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.credentials.Exports> } $export
	 */
	function($api,$context,$export) {
		var relative = $context.library.file.Location.directory.relativePath;

		var readString = $api.fp.world.Sensor.mapping({
			sensor: $context.library.file.Location.file.read.string.world()
		});

		var requireParents = $api.fp.world.Means.map({
			order: $context.library.file.Location.parent(),
			means: $context.library.file.Location.directory.require({ recursive: true })
		});

		/**
		 *
		 * @param { string } string
		 * @returns { slime.$api.fp.impure.Output<slime.jrunscript.file.Location> }
		 */
		var setFileContents = function(string) {
			return $api.fp.pipe(
				$context.library.file.Location.file.write,
				$api.fp.property("string"),
				$api.fp.world.Action.output(),
				$api.fp.impure.Output.process({ value: string }),
				$api.fp.impure.now.process
			)
		};

		/**
		 *
		 * @param { { project: slime.jrunscript.tools.git.credentials.Project, host: string, username: string } } p
		 */
		var getTokenLocation = function(p) {
			return $api.fp.now.invoke(
				p.project,
				$api.fp.property("base"),
				relative("local/git/credentials"),
				relative(p.host),
				relative(p.username)
			)
		};

		/**
		 *
		 * @param { Parameters<slime.jrunscript.tools.git.credentials.Exports["user"]["get"]>[0] } p
		 */
		var getUserTokenLocation = function(p) {
			var home = (p.home) ? p.home() : $context.library.shell.HOME.pathname.os.adapt();
			return $api.fp.now.invoke(
				home,
				relative(".inonit/git/credentials"),
				relative(p.host),
				relative(p.username)
			)
		}

		var readTokenLocation = $api.fp.pipe(getTokenLocation, readString);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["get"] } */
		var get = $api.fp.world.Sensor.from.flat(
			function(p) {
				var location = getTokenLocation(p.subject);
				return readString(location);
			}
		);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["user"]["get"] } */
		var userGet = $api.fp.world.Sensor.from.flat(
			function(p) {
				var location = getUserTokenLocation(p.subject);
				return readString(location);
			}
		);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["update"] } */
		var update = $api.fp.world.Means.from.flat(
			$api.fp.impure.Output.compose([
				function(p) {
					var writeToken = $api.fp.impure.Output.compose([
						$api.fp.world.output(requireParents),
						setFileContents(p.order.token)
					]);
					$api.fp.now.invoke(
						p.order,
						getTokenLocation,
						writeToken
					);
				},
				function(p) {
					p.events.fire("wrote", { username: p.order.username, destination: getTokenLocation(p.order) });
				}
			])
		);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["helper"] } */
		var helper = function(p) {
			/** @type { { host: string, password: string, username: string } } */
			var input = {
				host: void(0),
				password: void(0),
				username: void(0)
			};
			p.input.character().readLines(function(line) {
				var tokens = line.split("=");
				if (tokens.length >= 2) {
					input[tokens[0]] = tokens.slice(1).join("=");
					if (p.debug) p.debug(tokens[0] + "=" + input[tokens[0]]);
				}
			});
			if (p.debug) p.debug("input: " + JSON.stringify(input));

			if (p.operation == "get") {
				var token = readTokenLocation({
					project: p.project,
					host: input.host,
					username: input.username
				});

				var output = $api.Object.compose(input);
				if (token.present) {
					output.password = token.value;
					p.console("Obtained " + input.host + " token for " + input.username + ".");
				}
				(function() {
					for (var x in output) {
						if (p.debug) p.debug(x + "=" + output[x]);
						p.output(x + "=" + output[x]);
					}
				})();
				p.output("");
			}
		}

		$export({
			get: get,
			user: {
				location: getUserTokenLocation,
				get: userGet
			},
			helper: helper,
			update: update
		});
	}
//@ts-ignore
)($api,$context,$export);
