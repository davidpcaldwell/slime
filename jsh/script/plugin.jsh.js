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

//@ts-check
(
	/**
	 *
	 * @param { Packages } Packages
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { jsh } jsh
	 * @param { slime.Loader } $loader
	 */
	function(Packages,plugin,$slime,jsh,$loader) {
		/** @returns { slime.jsh.script.Exports } */
		var load = function($context) {
			/** @type { Partial<slime.jsh.script.Exports> } */
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
				$Pathname: $context.api.file.Pathname,
				parser: $context.api.parser
			}).getopts;

			$exports.Application = $loader.file("Application.js", {
				js: $context.api.js,
				getopts: $exports.getopts
			}).Application;

			/** @returns {slime.jsh.script.Exports} */
			var finished = function(partial) { return partial; }

			var rv = finished($exports);
			return rv;
		};

		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.java && jsh.file && jsh.http && jsh.shell);
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

				/** @type { slime.jsh.script.Exports["cli"]["parser"] } */
				var parser = (function(filesystem,workingDirectory) {
					var isAbsolute = function(string) {
						//	Cover UNIX case, Windows network drive, UNIX network drive
						var start = string.substring(0,1);
						if (start == filesystem.$jsh.PATHNAME_SEPARATOR) return true;
						if (filesystem.$jsh.PATHNAME_SEPARATOR == "\\") {
							if (string.substring(1,2) == ":" || string.substring(2,3) == filesystem.$jsh.PATHNAME_SEPARATOR) {
								return true;
							}
							//	Cover Windows drive letter
						}
						if (start == "/" || start == "\\") {
							//	using wrong path separator character, we handle as error
							throw "Path separator for this platform is " + filesystem.$jsh.PATHNAME_SEPARATOR;
						}
						return false;
					}

					return {
						/**
						 *
						 * @param { string } value
						 * @returns { slime.jrunscript.file.Pathname }
						 */
						pathname: function(value) {
							if (isAbsolute(value)) {
								return filesystem.Pathname(value);
							} else {
								return workingDirectory.getRelativePath(value);
							}
						}
					}
				})(jsh.file.filesystem, jsh.shell.PWD);

				jsh.script = load($api.Object.compose({
					api: {
						js: jsh.js,
						web: jsh.js.web,
						file: jsh.file,
						http: function() {
							return jsh.http;
						},
						addClasses: jsh.loader.java.add,
						parser: parser
					},
					directory: jsh.shell.PWD,
					arguments: jsh.java.Array.adapt($slime.getInvocation().getArguments()).map(function(s) { return String(s); }),
				}, source));

				jsh.script.cli = {
					parser: parser,
					option: {
						string: function(o) {
							var rv = function(p) {
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = p.arguments[++i];
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.Function.impure.revise(rv);
						},
						boolean: function(o) {
							var rv = function(p) {
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = true;
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.Function.impure.revise(rv);
						},
						number: function(o) {
							var rv = function(p) {
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = Number(p.arguments[++i]);
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.Function.impure.revise(rv);
						},
						pathname: function(o) {
							var rv = function(p) {
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname] = jsh.script.getopts.parser.Pathname(p.arguments[++i]);
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.Function.impure.revise(rv);
						},
						array: function(o) {
							var rv = function(p) {
								var args = [];
								p.options[o.longname] = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + o.longname) {
										p.options[o.longname].push(o.value(p.arguments[++i]));
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.Function.impure.revise(rv);
						}
					},
					Application: function(p) {
						return {
							run: function(args) {
								var global = (p.options) ? p.options({
									options: {},
									arguments: args
								}) : {
									options: {},
									arguments: args
								};
								var command = global.arguments.shift();
								if (!command) {
									jsh.shell.console("Usage: <command> [arguments]");
									return 1;
								}
								var referenced = (function() {
									/** @type { slime.jsh.script.Commands | slime.jsh.script.Command } */
									var rv = p.commands;
									var tokens = command.split(".");
									for (var i=0; i<tokens.length; i++) {
										rv = rv[tokens[i]];
										if (!rv) return rv;
									}
									return rv;
								})();

								/** @type { (v: any) => v is slime.jsh.script.Command } */
								var isCommand = function(v) {
									return typeof(v) == "function";
								};

								if (!referenced) {
									jsh.shell.console("Command " + command + " is " + referenced);
									return 1;
								}
								if (!isCommand(referenced)) {
									jsh.shell.console(command + " is object.");
									return 1;
								} else {
									try {
										var status = referenced(global);
										return status || 0;
									} catch (e) {
										jsh.shell.console(e);
										jsh.shell.console(e.stack);
										return 1;
									}
								}
							}
						}
					},
					wrap: function(descriptor) {
						jsh.shell.exit(jsh.script.cli.Application(descriptor).run(jsh.script.arguments.slice()));
					}
				};

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
	}
//@ts-ignore
)(Packages,plugin,$slime,jsh,$loader)
