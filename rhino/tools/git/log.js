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
	 * @param { slime.jrunscript.tools.git.internal.log.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.internal.log.Exports> } $export
	 */
	function($api,$context,$export) {
		var format = (
			function() {
				//	TODO	refactor parse() to refer to fields by name by indexing fields by string

				var fields = ["H", "cn", "s", "ct", "an", "D", "ae", "at", "ce"];

				var mask = fields.map(function(field) {
					return "%" + field;
				}).join("~~");

				/**
				 * @param { string } line
				 * @returns { slime.jrunscript.tools.git.Commit }
				 */
				var parse = function(line) {
					var tokens = line.split("~~");
					if (typeof(tokens[5]) == "undefined") throw new Error("No tokens[5]: [" + line + "]");
					var refs = (function(string) {
						var rv = {};
						if (string.length == 0) return rv;
						var tokens = string.split(", ");
						tokens.forEach(function(token) {
							var t = token.split(" -> ");
							if (t.length > 1) {
								if (!rv.names) rv.names = [];
								rv.names.push(t[1]);
							} else {
								if (!rv.names) rv.names = [];
								rv.names.push(t[0]);
							}
						});
						return rv;
					})(tokens[5]);
					return {
						names: refs.names,
						commit: {
							hash: tokens[0]
						},
						author: {
							name: tokens[4],
							email: tokens[6],
							date: new $context.library.time.When({ unix: Number(tokens[7])*1000 })
						},
						committer: {
							name: tokens[1],
							email: tokens[8],
							date: new $context.library.time.When({ unix: Number(tokens[3])*1000 })
						},
						subject: tokens[2]
					}
				}

				return {
					mask: mask,
					argument: "--format=format:" + mask,
					parse: parse
				}
			}
		)();

		$export({
			format: format
		})
	}
//@ts-ignore
)($api,$context,$export);
