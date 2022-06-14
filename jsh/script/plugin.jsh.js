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
	 * @param { slime.jsh.plugin.plugin } plugin
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 */
	function(Packages,plugin,$slime,$api,jsh,$loader) {
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

			$exports.Application = $loader.file("Application.js", {
				js: $context.api.js,
				getopts: $exports.getopts
			}).Application;

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

		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.file && jsh.http && jsh.shell);
			},
			load: function() {
				/** @type { slime.jsh.script.internal.Source } */
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
							throw new Error("Path separator for this platform is " + filesystem.$jsh.PATHNAME_SEPARATOR);
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

				jsh.script = load(
					$api.Object.compose(
						{
							api: {
								js: jsh.js,
								web: jsh.web,
								file: jsh.file,
								http: function() {
									return jsh.http;
								},
								addClasses: jsh.loader.java.add,
								parser: parser
							},
							directory: jsh.shell.PWD,
							arguments: jsh.java.Array.adapt($slime.getInvocation().getArguments()).map(function(s) { return String(s); }),
						},
						source
					)
				);

				var option = function(parse) {
					return function(o) {
						var rv = function(p) {
							if (typeof(o.default) != "undefined") p.options[o.longname] = o.default;
							var args = [];
							for (var i=0; i<p.arguments.length; i++) {
								if (o.longname && p.arguments[i] == "--" + o.longname) {
									p.options[o.longname] = parse(p.arguments[++i]);
								} else {
									args.push(p.arguments[i]);
								}
							}
							p.arguments = args;
						};
						return $api.Function.impure.revise(rv);
					}
				};

				function getCommandList(rv,commands,prefix) {
					if (!prefix) prefix = "";
					for (var x in commands) {
						if (typeof(commands[x]) == "function") {
							rv.push(prefix + x);
						}
						getCommandList(rv,commands[x],prefix + x + ".");
					}
				}

				function getCommand(p) {
					var command = p.arguments[0];
					if (!command) {
						return new jsh.script.cli.error.NoTargetProvided();
					}

					var referenced = (function() {
						/** @type { slime.jsh.script.cli.Commands | slime.jsh.script.cli.Command } */
						var rv = p.commands;
						var tokens = command.split(".");
						for (var i=0; i<tokens.length; i++) {
							rv = rv[tokens[i]];
							if (!rv) return rv;
						}
						return rv;
					})();

					/** @type { (v: any) => v is slime.jsh.script.cli.Command } */
					var isCommand = function(v) {
						return typeof(v) == "function";
					};

					if (!referenced) {
						return new jsh.script.cli.error.TargetNotFound("Command " + command + " is " + referenced, {
							command: command
						});
					}
					if (!isCommand(referenced)) {
						return new jsh.script.cli.error.TargetNotFunction(command + " is object.", {
							command: command,
							target: referenced
						});
					} else {
						return {
							command: referenced,
							invocation: {
								options: p.options,
								arguments: p.arguments.slice(1)
							}
						}
					}
				}

				/** @type { slime.jsh.script.cli.Exports["Call"]["get"] } */
				var getCall = function(p) {
					var options = p.descriptor.options || $api.Function.identity;
					var global = options({ options: {}, arguments: p.arguments });
					var call = getCommand({
						options: global.options,
						commands: p.descriptor.commands,
						arguments: global.arguments
					});
					return call;
				}

				jsh.script.cli = {
					Call: {
						get: getCall
					},
					option: {
						string: option($api.Function.identity),
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
						number: option(Number),
						pathname: option(jsh.script.getopts.parser.Pathname),
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
					error: {
						NoTargetProvided: $api.Error.Type({ name: "NoTargetProvided" }),
						TargetNotFound: $api.Error.Type({ name: "TargetNotFound" }),
						TargetNotFunction: $api.Error.Type({ name: "TargetNotFunction", extends: TypeError })
					},
					parser: parser,
					/**
					 * @template { any } T
					 * @param { slime.jsh.script.cli.Processor<T> } f
					 */
					invocation: function(f) {
						/** @type { slime.js.Cast<T> } */
						var cast = $api.Function.cast;
						return f({
							options: cast({}),
							arguments: Array.prototype.slice.call(jsh.script.arguments)
						});
					},
					run: function(command) {
						try {
							var status = command({
								options: {},
								arguments: jsh.script.arguments
							});
							if (typeof(status) == "number") {
								jsh.shell.exit(status);
							}
							jsh.shell.exit(0);
						} catch (e) {
							jsh.shell.console(e);
							jsh.shell.console(e.stack);
							jsh.shell.exit(1);
						}
					},
					wrap: function wrap(descriptor) {
						function showUsage() {
							jsh.shell.console("Usage: " + jsh.script.file + " [options] <command> [arguments]");
						}

						function showCommands() {
							var rv = [];
							getCommandList(rv, descriptor.commands);
							jsh.shell.console("Available commands:");
							jsh.shell.console("");
							rv.forEach(function(item) {
								jsh.shell.console(item);
							});
						}

						var call = getCall({
							descriptor: descriptor,
							arguments: jsh.script.arguments.slice()
						});
						var isTargetNotFunction = $api.Error.isType(jsh.script.cli.error.TargetNotFunction);

						if ($api.Error.isType(jsh.script.cli.error.NoTargetProvided)(call)) {
							showUsage();
							jsh.shell.console("");
							showCommands();
							jsh.shell.exit(1);
						} else if ($api.Error.isType(jsh.script.cli.error.TargetNotFound)(call)) {
							jsh.shell.console("Command not found: " + call.command);
							jsh.shell.console("");
							showCommands();
							jsh.shell.exit(1);
						} else if (isTargetNotFunction(call)) {
							jsh.shell.console("Command is not function: " + call.command + " is " + call.target);
							jsh.shell.exit(1);
						} else {
							try {
								var status = call.command(call.invocation);
								if (typeof(status) != "undefined") {
									jsh.shell.exit(status);
								}
							} catch (e) {
								jsh.shell.console(e);
								jsh.shell.console(e.stack);
								jsh.shell.exit(1);
							}
						}
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
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.web && jsh.file && jsh.script && jsh.http);
			},
			load: function() {
				/**
				 * @param { string } string
				 */
				var interpretModuleLocation = function(string) {
					/** @type { slime.web.Exports } */
					var web = jsh.web;

					//	try to see whether it's an absolute path
					var location = jsh.file.Pathname(string);

					//	we don't want to use the location if it is a relative path; it will be handled later by jsh.script.loader
					//	in the calling code
					var isAbsolute = function(location) {
						return location.toString() == string;
					}

					if (isAbsolute(location)) {
						if (location.directory) {
							return location.directory;
						} else if (location.file) {
							return location.file;
						}
					}

					//	then, let's check to see if it's a URL. For now we only support URLs with schemes.
					/** @type { slime.web.Url } */
					var url = web.Url.parse(string);
					if (url.scheme) {
						return url;
					}
				};

				/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.jrunscript.file.Directory } */
				var isDirectory = function(location) {
					return typeof(location["pathname"]) == "object" && location["directory"] === true;
				}

				/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.jrunscript.file.File } */
				var isFile = function(location) {
					return typeof(location["pathname"]) == "object" && location["directory"] === false;
				}

				/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.web.Url } */
				var isUrl = function(location) {
					return typeof(location["scheme"]) == "string";
				}

				jsh.loader.module = (function(was) {
					/** @type { (p: any) => p is slime.web.Url } */
					var isUrl = function(p) {
						return typeof(p) == "object" && p.scheme && p.host && p.path;
					}

					/**
					 *
					 * @param { slime.web.Url } location
					 * @returns
					 */
					var fromUrl = function(location) {
						var object = jsh.web.Url.parse(jsh.web.Url.codec.string.encode(location));
						var base = object.resolve("./");
						var path = (base.toString() == location.toString()) ? "module.js" : location.toString().substring(base.toString().length);
						var loader = new jsh.http.Client().Loader(base);
						return function(code) {
							code = path;
							return loader.module.apply(loader, arguments);
						}
					}

					return function(code) {
						if (isUrl(code)) {
							return fromUrl(code).apply(this, arguments);
						}
						if (typeof(code) == "string") {
							var location = interpretModuleLocation(code);
							if (location && isFile(location)) {
								code = location.pathname;
							} else if (location && isDirectory(location)) {
								code = location.pathname;
							} else if (location && isUrl(location)) {
								return fromUrl(location).apply(this, arguments);
							} else {
								return jsh.script.loader.module.apply(jsh.script.loader, arguments);
							}
						}
						return was.apply(this,arguments);
					}
				})(jsh.loader.module);

				var loadUrl = function(url) {
					var response = new jsh.http.Client().request({
						url: url
					});
					//	TODO	maybe better error handling?
					if (response.status.code != 200) return null;
					//	TODO	the strange remapping below is because of some inconsistency between jrunscript Resource types
					//			and HTTP client bodies. Need to do some low-level refactoring, possibly.
					return {
						type: response.body.type,
						stream: {
							binary: response.body.stream
						}
					}
				};

				["file","value","run"].forEach(function(operation) {
					jsh.loader[operation] = (function(was) {
						return function(code) {
							if (typeof(code) == "object" && code.scheme && code.host && code.path) {
								code = loadUrl(code);
							}
							if (typeof(code) == "string") {
								var location = interpretModuleLocation(code);
								if (location && isFile(location)) {
									code = location.pathname;
								} else if (location && isUrl(location)) {
									var response = loadUrl(location);
									if (response) code = response;
								} else if (location && isDirectory(location)) {
									throw new TypeError("Cannot " + operation + " code from directory " + location);
								} else {
									return jsh.script.loader[operation].apply(jsh.script.loader, arguments);
								}
							}
							return was.apply(this, arguments);
						}
					})(jsh.loader[operation]);
				})
			}
		})
	}
//@ts-ignore
)(Packages,plugin,$slime,$api,jsh,$loader)
