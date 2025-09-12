//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function() {
		//	TODO	Add @types/node to project so that below ts-ignore are not necessary

		//	@ts-ignore
		var fs = require("fs");

		//	@ts-ignore
		var process = require("process");

		//	@ts-ignore
		var base = fs.realpathSync(__filename + "/../../..");

		/** @type { slime.runtime.scope.Deployment } */
		var $slime = {
			getRuntimeScript: function(path) {
				var location = base + "/" + "loader/" + path;
				return {
					name: path,
					js: fs.readFileSync(location).toString()
				};
			},
			configuration: (
				function() {
					const pattern = /^SLIME_(.*)$/;
					return Object.entries(process.env).reduce(function(rv,entry) {
						const name = entry[0].toUpperCase();
						const value = entry[1];
						if (pattern.test(name)) {
							//	check for duplicates?
							rv[name] = value;
						}
						return rv;
					}, {});
				}
			)()
		};

		var runtime = (
			/**
			 *
			 * @param { slime.runtime.Scope } scope
			 * @returns { slime.runtime.Exports }
			 */
			function(scope) {
				var code = fs.readFileSync(base + "/" + "loader/expression.js").toString();
				try {
					return eval(code);
				} catch (e) {
					var ex = e;
				}
			}
		)({
			$slime: $slime
		});

		/**
		 *
		 * @returns { slime.node.Exports["fs"] }
		 */
		var exports_fs = (
			function() {
				/**
				 *
				 * @param { string } path
				 * @returns { slime.old.loader.Source }
				 */
				function toSource(path) {
					return {
						get: function(at) {
							var location = path + at;
							var stat = fs.statSync(location, {
								//@ts-ignore
								throwIfNoEntry: false
							});
							if (!stat) return null;
							if (stat.isDirectory()) throw new TypeError("Cannot open directory.");
							var name = at.split("/").slice(-1)[0];
							return {
								name: name,
								read: {
									string: function() {
										return fs.readFileSync(location).toString();
									}
								}
							}
						}
					}
				}
				return {
					Loader: function(p) {
						return new runtime.old.Loader(toSource(p.base));
					}
				}
			}
		)();

		exports.runtime = runtime;
		exports.fs = exports_fs;
	}
//@ts-ignore
)();
