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
	 * @param { slime.jsh.script.old.application.Context } $context
	 * @param { slime.loader.Export<slime.jsh.script.old.application.Exports> } $export
	 */
	function($api,$context,$export) {
		//	TODO	is there a better way in our error framework?
		var newError = function(p) {
			var message = (p.message) ? p.message : Object.keys(p)[0];
			var e = new Error(message);
			for (var x in p) {
				e[x] = p[x];
			}
			return e;
		}

		/** @type { slime.jsh.script.old.application.Exports } */
		var Application = function(o) {
			var toFunction = function(command) {
				if (command.getopts) {
					return function(globals) {
						var parameters = $context.getopts(command.getopts, globals.arguments);
						return command.run.call(this,
							$api.Object.compose(
								{
									global: globals.options
								},
								parameters
							)
						);
					}
				} else {
					throw new Error("Unsupported command format: lacking getopts");
				}
			};

			this.getCommands = $api.experimental(function() {
				//	TODO	things could go wrong; caller could set up a cyclic reference, for example
				/**
				 *
				 * @param { slime.jsh.script.old.application.Command | slime.jsh.script.old.application.Commands } target
				 * @param { { [name: string]: slime.jsh.script.old.application.Command } } [rv]
				 * @param { string } [prefix]
				 * @returns
				 */
				var get = function(target,rv,prefix) {
					if (!rv) rv = {};
					if (!prefix) prefix = "";
					for (var x in target) {
						if (target[x] && typeof(target[x]) == "object" && typeof(target[x].run) == "function") {
							rv[prefix+x] = target[x];
						}
						get(target[x],rv,prefix+x+".");
					}
					return rv;
				}
				return get(o.commands);
			});

			this.run = function() {
				var globals = $context.getopts({
					options: o.options,
					unhandled: $context.getopts.UNEXPECTED_OPTION_PARSER.SKIP
				}, arguments);

				if (globals.arguments.length == 0) {
					throw newError({ usage: true });
				}

				var command = globals.arguments.shift();
				var tokens = command.split(".");
				var target = o.commands;
				for (var i=0; i<tokens.length; i++) {
					target = target[tokens[i]];
				}
				var object = target;
				if (typeof(object) != "object" || !object) {
					throw newError({ commandNotFound: command });
				}
				return toFunction(object).call(o, { options: globals.options, arguments: globals.arguments });
			};
		};

		$export(Application);
	}
//@ts-ignore
)($api,$context,$export);
