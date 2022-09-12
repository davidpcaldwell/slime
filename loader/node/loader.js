//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function() {
		//	TODO	figure out why next two ts-ignore are necessary; without them, a tsc-related test fails

		//	@ts-ignore
		var fs = require("fs");

		//	@ts-ignore
		var base = fs.realpathSync(__filename + "/../../..");

		/** @type { slime.runtime.$slime.Deployment } */
		var $slime = {
			getRuntimeScript: function(path) {
				var location = base + "/" + "loader/" + path;
				return {
					name: path,
					js: fs.readFileSync(location).toString()
				};
			}
		};

		/** @type { slime.runtime.$engine } */
		var $engine = {
			Object: void(0),
			MetaObject: void(0),
			execute: function(script,scope,target) {
				var scoped = Object.keys(scope).map(function(key) {
					return {
						name: key,
						value: scope[key]
					};
				});
				var args = scoped.map(function(variable) { return variable.name; }).concat([ script.js ]);
				var f = Function.apply(null, args);
				return f.apply(target, scoped.map(function(variable) { return variable.value; }));
			}
		};

		/** @type { slime.runtime.Exports } */
		var runtime = (function(scope) {
			var code = fs.readFileSync(base + "/" + "loader/expression.js").toString();
			try {
				return eval(code);
			} catch (e) {
				var ex = e;
			}
		})({
			$slime: $slime,
			$engine: $engine,
			Packages: void(0)
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
				 * @returns { slime.loader.Source }
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
