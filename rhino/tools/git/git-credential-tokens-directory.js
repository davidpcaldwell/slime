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

		var tryReadString = $context.library.file.Location.file.read.string.maybe;

		var requireParents = $api.fp.world.Means.map({
			order: $context.library.file.Location.parent(),
			means: $context.library.file.Location.directory.require({ recursive: true }).wo
		});

		/**
		 *
		 * @param { string } string
		 * @returns { slime.$api.fp.impure.Output<slime.jrunscript.file.Location> }
		 */
		var setFileContents = function(string) {
			//	TODO	pipelining is probably not the most straightforward way to do this
			return $api.fp.pipe(
				$context.library.file.Location.file.write.old,
				$api.fp.property("string"),
				$api.fp.world.Action.output(),
				function(output) {
					return $api.fp.impure.Output.process({
						value: { value: string },
						output: output
					})
				},
				$api.fp.impure.Process.now
			)
		};

		//	Reader applicative pipeline: distributes a shared argument to each pipeline stage
		var readerPipe = function(f /*, ...transforms */) {
			var transforms = Array.prototype.slice.call(arguments, 1);
			return function(a) {
				return $api.fp.now.apply(null, [f(a)].concat(transforms.map(function(t) { return t(a); })));
			};
		};

		/** @type { (p: { store: slime.jrunscript.file.Location, host: string, username: string }) => slime.jrunscript.file.Location } */
		var getTokenLocation = readerPipe(
			$api.fp.property("store"),
			$api.fp.pipe($api.fp.property("host"), relative),
			$api.fp.pipe($api.fp.property("username"), relative)
		);

		// Alternate implementation of above using standard $api.fp

		// /** @type { (p: { store: slime.jrunscript.file.Location, host: string, username: string }) => slime.jrunscript.file.Location } */
		// var getTokenLocation = $api.fp.pipe(
		// 	$api.fp.split({
		// 		argument: $api.fp.identity,
		// 		rv: $api.fp.property("store")
		// 	}),
		// 	$api.fp.Object.property.set({ rv: function(p) { return $api.fp.now.map(p.rv, relative(p.argument.host) )}}),
		// 	$api.fp.Object.property.set({ rv: function(p) { return $api.fp.now.map(p.rv, relative(p.argument.username) )}}),
		// 	$api.fp.property("rv")
		// )

		/**
		 *
		 * @param { { project: slime.jrunscript.tools.git.credentials.Project, host: string, username: string } } p
		 */
		var getProjectTokenLocation = function(p) {
			return $api.fp.now.map(
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
			return $api.fp.now.map(
				p.home || $context.library.shell.HOME.pathname.os.adapt(),
				relative(".inonit/git/credentials"),
				relative(p.host),
				relative(p.username)
			)
		}

		var readProjectTokenLocation = $api.fp.pipe(getProjectTokenLocation, tryReadString);

		var readUserTokenLocation = $api.fp.pipe(getUserTokenLocation, tryReadString);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["get"] } */
		var get = $api.fp.world.Sensor.from.flat(
			$api.fp.pipe(
				$api.fp.property("subject"),
				getProjectTokenLocation,
				tryReadString
			)
		);

		/** @type { slime.jrunscript.tools.git.credentials.Exports["user"]["get"] } */
		var userGet = $api.fp.world.Sensor.from.flat(
			$api.fp.pipe(
				$api.fp.property("subject"),
				getUserTokenLocation,
				tryReadString
			)
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
						getProjectTokenLocation,
						writeToken
					);
				},
				function(p) {
					p.events.fire("wrote", { username: p.order.username, destination: getProjectTokenLocation(p.order) });
				}
			])
		);

		/**
		 * @param { { debug: slime.$api.fp.impure.Effector<string> } } p
		 * @returns { (input: slime.jrunscript.runtime.io.InputStream) => slime.jrunscript.tools.git.credentials.Data }
		 */
		var read = function(p) {
			return function(input) {
				return input.read.string.simple().split("\n").reduce(function(input, line) {
					var tokens = line.split("=");
					if (tokens.length >= 2) {
						input[tokens[0]] = tokens.slice(1).join("=");
						if (p.debug) p.debug(tokens[0] + "=" + input[tokens[0]]);
					}
					return input;
				}, /** @type { slime.jrunscript.tools.git.credentials.Data } } */({}));
			}
		};

		/** @type { slime.jrunscript.tools.git.credentials.Exports["helper"] } */
		var helper = function(p) {
			var input = read({ debug: p.debug })(p.input);

			if (p.debug) p.debug("input: " + JSON.stringify(input));

			if (p.operation == "get") {
				var token = readProjectTokenLocation({
					project: {
						//	git credential helpers set PWD to the local checkout, even when -C is used (tested this)
						base: $context.library.shell.PWD.pathname.os.adapt()
					},
					host: input.host,
					username: input.username
				});

				if (p.debug) p.debug("Token present in project " + $context.library.shell.PWD.pathname.os.adapt().pathname + ": " + token.present);

				if (p.debug) p.debug("Checking user token location ...");
				if (!token.present) {
					token = readUserTokenLocation({
						host: input.host,
						username: input.username
					})
				}

				if (p.debug) p.debug("Token present: " + token.present);

				var output = $api.Object.compose(input);
				if (token.present) {
					output.password = token.value;
					//	TODO	would be nice to report where it came from, maybe just in debugging though
					p.console("Obtained " + input.host + " token for " + input.username + ".");
				}

				if (p.debug) p.debug("Output keys: " + Object.keys(output));
				(function() {
					for (var x in output) {
						if (p.debug) p.debug("Output: " + x + "=" + output[x]);
						if (typeof(output[x]) != "undefined") {
							p.output(x + "=" + output[x]);
						}
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
			password: function(f) {
				return function(p) {
					var input = read({
						debug: p.debug
					})(p.input);
					var output = $api.Object.compose(input);
					if (p.operation == "get") {
						var password = f(input)
						if (password.present) output.password = password.value;
					}
					for (var x in output) {
						p.output(x + "=" + output[x]);
					}
				}
			},
			helper: helper,
			update: update,
			test: {
				getTokenLocation: getTokenLocation,
				getProjectTokenLocation: getProjectTokenLocation,
				getUserTokenLocation: getUserTokenLocation
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
