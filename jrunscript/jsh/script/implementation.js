//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.script.internal.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.script.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jsh.script.old.application.Script } */
			Application: $loader.script("Application.js")
		}

		/**
		 * @param { slime.jsh.script.internal.Context } $context
		 * @returns { slime.jsh.script.Exports }
		 */
		var load = function($context) {
			/** @type { Partial<slime.jsh.script.Exports> } */
			var $exports = {};

			if ($context.file) {
				$exports.file = $context.file;
				$exports.script = $context.file;

				$exports.pathname = $context.file.pathname;
				$api.deprecate($exports,"pathname");
				$exports.getRelativePath = function(path) {
					return $context.file.parent.getRelativePath(path);
				}
				$api.deprecate($exports,"getRelativePath");
			} else if ($context.packaged) {
				$exports.file = $context.packaged.file;
			} else if ($context.uri) {
				$exports.url = $context.api.web.Url.parse($context.uri);
			} else {
			//	throw new Error("Unreachable.");
			}
			$exports.arguments = $context.arguments;
			$exports.addClasses = $api.deprecate($context.api.addClasses);

			//	TODO	should jsh.script.loader support some sort of path structure?
			if ($context.packaged) {
				$exports.loader = $context.packaged.loader;
			} else if ($context.file) {
				$exports.loader = new $context.api.file.Loader({ directory: $context.file.parent });
			} else if ($context.uri) {
				Object.defineProperty($exports, "loader", new function() {
					var value;

					var get = function() {
						var http = $context.api.http();
						var client = new http.Client();
						var base = $context.uri.split("/").slice(0,-1).join("/") + "/";
						return new client.Loader(base);
					};

					this.get = function() {
						if (!value) {
							value = get();
						}
						return value;
					};

					this.set = function(v) {
						//	TODO	validate argument
						value = v;
					};
				});
			}

			if ($context.file) {
				$exports.Loader = function(path) {
					var base = $context.file.parent.getRelativePath(path).directory;
					return new $context.api.file.Loader({ directory: base });
				};
			} else if ($context.uri) {
				var _uri = new Packages.java.net.URI($context.uri);
				$exports.Loader = function(path) {
					var _relative = _uri.resolve(path);
					var base = _relative.toString();
					var http = $context.api.http();
					return new http.Client().Loader(base);
				}
			}

			$exports.getopts = $loader.file("getopts.js", {
				$arguments: $exports.arguments,
				$Pathname: $context.api.file.Pathname,
				parser: $context.api.parser
			}).getopts;

			$exports.Application = Object.assign(
				code.Application({
					getopts: $exports.getopts
				}),
				{
					run: void(0)
				}
			);

			//	TODO	think this through, what about packaged shells etc.?
			$exports.world = ($context.file) ? {
				file: {
					filesystem: $context.api.file.world.filesystems.os,
					pathname: $context.file.toString()
				}
			} : void(0)

			/** @returns {slime.jsh.script.Exports} */
			var finished = function(partial) { return partial; }

			var rv = finished($exports);
			return rv;
		};

		$export(load($context));
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
