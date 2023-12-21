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
	 * @param { slime.jrunscript.tools.github.credentials.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.github.credentials.Exports> } $export
	 */
	function($api,$context,$export) {
		var exists = $api.fp.world.mapping($context.library.file.Location.file.exists());

		var relative = $context.library.file.Location.directory.relativePath;

		var readString = $api.fp.world.mapping($context.library.file.Location.file.read.string());

		var requireParents = $api.fp.world.Action.pipe(
			$context.library.file.Location.parent()
		)(
			$context.library.file.Location.directory.require({ recursive: true })
		);

		/**
		 *
		 * @param { string } string
		 * @returns { (file: slime.jrunscript.file.Location) => void }
		 */
		var setFileContents = function(string) {
			return function(file) {
				$api.fp.world.now.action(
					$context.library.file.Location.file.write(file).string,
					{ value: string }
				);
			}
		};

		/**
		 *
		 * @param { { project: slime.jrunscript.tools.github.credentials.Project, host: string, username: string } } p
		 */
		var getTokenLocation = function(p) {
			return $api.fp.now.invoke(
				p.project,
				$api.fp.property("base"),
				relative("local/git-credential"),
				relative(p.host),
				relative(p.username)
			)
		};

		var readTokenLocation = $api.fp.pipe(getTokenLocation, readString);

		/** @type { slime.jrunscript.tools.github.credentials.Exports["update"] } */
		var update = function(order) {
			return function(events) {
				var destination = getTokenLocation(order);
				$api.fp.impure.now.process(
					$api.fp.impure.Process.output(
						destination,
						$api.fp.impure.Output.compose([
							$api.fp.world.output(requireParents),
							setFileContents(order.token)
						])
					)
				);
				events.fire("wrote", { username: order.username, destination: destination });
			}
		};

		/** @type { slime.jrunscript.tools.github.credentials.Exports["helper"] } */
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
			helper: helper,
			update: update
		});
	}
//@ts-ignore
)($api,$context,$export);
