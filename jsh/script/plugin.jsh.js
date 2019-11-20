//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var load = function($context) {
	var $exports = {};

	if ($context.file) {
		$exports.file = $context.file;
		$exports.script = $context.file;

		$exports.pathname = $context.file.pathname;
		$api.deprecate($exports,"pathname");
		$exports.getRelativePath = function(path) {
			return $context.file.getRelativePath(path);
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
			var base = $context.file.getRelativePath(path).directory;
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
		$filesystem: $context.api.file.filesystem,
		$workingDirectory: $context.directory,
		$Pathname: $context.api.file.Pathname
	}).getopts;

	$exports.Application = $loader.file("Application.js", {
		js: $context.api.js,
		getopts: $exports.getopts
	}).Application;

	return $exports;
};

plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.file && jsh.http && jsh.shell;
	},
	load: function() {
		var source = (function() {
			var _script = $slime.getInvocation().getScript();
			var _uri = _script.getUri();
			var rv = {};
			if (_uri) {
				if (_uri.getScheme() && String(_uri.getScheme()) == "file") {
					rv.file = jsh.file.filesystem.java.adapt(new Packages.java.io.File(_uri)).file;
				}
				rv.uri = String(_uri.normalize().toString());
			}
			if ($slime.getPackaged()) {
				rv.packaged = {
					file: jsh.file.filesystem.java.adapt($slime.getPackaged().getFile()).file,
					loader: new jsh.io.Loader({ _source: $slime.getPackaged().getCode() })
				}
			}
			return rv;
		})();

		jsh.script = load(jsh.js.Object.set({}, {
			api: {
				js: jsh.js,
				web: jsh.js.web,
				file: jsh.file,
				http: function() {
					return jsh.http;
				},
				addClasses: jsh.loader.java.add
			},
			directory: jsh.shell.PWD,
			arguments: jsh.java.Array.adapt($slime.getInvocation().getArguments()).map(function(s) { return String(s); }),
		}, source));

		jsh.script.Application.run = function(descriptor,args) {
			try {
				return new jsh.script.Application(descriptor).run.apply(null, (args) ? args : jsh.script.arguments);
			} catch (e) {
				if (e.usage) {
					jsh.shell.console("Usage: " + jsh.script.file + " <command> [arguments]");
					jsh.shell.exit(1);
				} else if (e.commandNotFound) {
					jsh.shell.console("Command not found: " + e.commandNotFound);
					jsh.shell.exit(1);
				} else {
					jsh.shell.console(e);
					if (e.stack) {
						jsh.shell.console(e.stack);
					}
					throw e;
				}
			}
		};

		jsh.shell.getopts = $api.deprecate(jsh.script.getopts);
	}
})