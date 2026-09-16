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
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.runtime.loader.Store } $loader
	 */
	function(Packages,plugins,plugin,$slime,$api,jsh,$loader) {
		//	TODO	is any of this needed?!?

		// var code = {
		// 	/** @type { slime.jsh.script.old.application.Script } */
		// 	Application: $loader.script("Application.js")
		// }
		// /**
		//  * @param { slime.jsh.script.internal.Context } $context
		//  * @returns { slime.jsh.script.Exports }
		//  */
		// var load = function($context) {
		// 	/** @type { Partial<slime.jsh.script.Exports> } */
		// 	var $exports = {};

		// 	if ($context.file) {
		// 		$exports.file = $context.file;
		// 		$exports.script = $context.file;

		// 		$exports.pathname = $context.file.pathname;
		// 		$api.deprecate($exports,"pathname");
		// 		$exports.getRelativePath = function(path) {
		// 			return $context.file.parent.getRelativePath(path);
		// 		}
		// 		$api.deprecate($exports,"getRelativePath");
		// 	} else if ($context.packaged) {
		// 		$exports.file = $context.packaged.file;
		// 	} else if ($context.uri) {
		// 		$exports.url = $context.api.web.Url.parse($context.uri);
		// 	} else {
		// 	//	throw new Error("Unreachable.");
		// 	}
		// 	$exports.arguments = $context.arguments;
		// 	$exports.addClasses = $api.deprecate($context.api.addClasses);

		// 	//	TODO	should jsh.script.loader support some sort of path structure?
		// 	if ($context.packaged) {
		// 		$exports.loader = $context.packaged.loader;
		// 	} else if ($context.file) {
		// 		$exports.loader = new $context.api.file.Loader({ directory: $context.file.parent });
		// 	} else if ($context.uri) {
		// 		Object.defineProperty($exports, "loader", new function() {
		// 			var value;

		// 			var get = function() {
		// 				var http = $context.api.http();
		// 				var client = new http.Client();
		// 				var base = $context.uri.split("/").slice(0,-1).join("/") + "/";
		// 				return new client.Loader(base);
		// 			};

		// 			this.get = function() {
		// 				if (!value) {
		// 					value = get();
		// 				}
		// 				return value;
		// 			};

		// 			this.set = function(v) {
		// 				//	TODO	validate argument
		// 				value = v;
		// 			};
		// 		});
		// 	}

		// 	if ($context.file) {
		// 		$exports.Loader = function(path) {
		// 			var base = $context.file.parent.getRelativePath(path).directory;
		// 			return new $context.api.file.Loader({ directory: base });
		// 		};
		// 	} else if ($context.uri) {
		// 		var _uri = new Packages.java.net.URI($context.uri);
		// 		$exports.Loader = function(path) {
		// 			var _relative = _uri.resolve(path);
		// 			var base = _relative.toString();
		// 			var http = $context.api.http();
		// 			return new http.Client().Loader(base);
		// 		}
		// 	}

		// 	$exports.getopts = $loader.file("getopts.js", {
		// 		$arguments: $exports.arguments,
		// 		$Pathname: $context.api.file.Pathname,
		// 		parser: $context.api.parser
		// 	}).getopts;

		// 	$exports.Application = Object.assign(
		// 		code.Application({
		// 			getopts: $exports.getopts
		// 		}),
		// 		{
		// 			run: void(0)
		// 		}
		// 	);

		// //	TODO	think this through, what about packaged shells etc.?
		// $exports.world = ($context.file) ? {
		// 	file: {
		// 		filesystem: $context.api.file.world.filesystems.os,
		// 		pathname: $context.file.toString()
		// 	}
		// } : void(0)

		// /** @returns {slime.jsh.script.Exports} */
		// var finished = function(partial) { return partial; }

		// var rv = finished($exports);
		// return rv;
		// };

		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.file && jsh.http && plugins.shell);
			},
			load: function() {
				/** @type { slime.jsh.script.internal.Script } */
				var implementation = $loader.script("implementation.js");

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
						/** @type { slime.js.Cast<slime.loader.old.Loader> } */
						var toJavaLoader = $api.fp.cast.unsafe;
						var x = toJavaLoader(new jsh.io.Loader({ _source: $slime.getPackaged().getCode() }));
						rv.packaged = {
							file: jsh.file.filesystem.java.adapt($slime.getPackaged().getFile()).file,
							loader: x
						}
					}
					return rv;
				})();

				/** @type { slime.jsh.script.Exports["cli"]["parser"] } */
				var parser = (function(filesystem,workingDirectory) {
					var isAbsolute = function(string) {
						if (typeof(string) == "undefined") throw new TypeError("Path string is undefined.");
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
							if (typeof(value) == "undefined") throw new TypeError("'value' is undefined.");
							if (isAbsolute(value)) {
								return filesystem.Pathname(value);
							} else {
								return workingDirectory.getRelativePath(value);
							}
						}
					}
				})(jsh.file.filesystem, plugins.shell.PWD);

				jsh.script = implementation(
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
							directory: plugins.shell.PWD,
							//	TODO	this is now redundant with code in the loader jsh.js that converts arguments to native form
							//			for use with the new main() function API
							arguments: jsh.java.Array.adapt($slime.getInvocation().getArguments()).map(function(s) { return String(s); }),
						},
						source
					)
				);

				/**
				 * @template { any } T
				 * @param { (s: string) => T } parse
				 * @returns { slime.jsh.script.cli.OptionParser<T> }
				 */
				var option = function(parse) {
					/** @returns { o is slime.jsh.script.cli.OptionWithDefault<string,T> } */
					var isWithDefault = function(o) { return o["default"]; }
					/** @returns { o is slime.jsh.script.cli.OptionWithElse<string,T> } */
					var isWithElse = function(o) { return o["else"]; }

					return function(o) {
						var rv = function(p) {
							if (isWithDefault(o)) {
								//	we set the value to the default; it will be overwritten if specified
								p.options[o.longname] = o.default;
							}
							var args = [];
							for (var i=0; i<p.arguments.length; i++) {
								if (o.longname && p.arguments[i] == "--" + o.longname) {
									p.options[o.longname] = parse(p.arguments[++i]);
								} else {
									args.push(p.arguments[i]);
								}
							}
							if (typeof(p.options[o.longname]) == "undefined" && isWithElse(o)) {
								p.options[o.longname] = o.else();
							}
							p.arguments = args;
						};
						return $api.fp.object.revise(rv);
					}
				};

				var metadataStore = (function() {
					var property = "__slime_jsh_script_cli_metadata__";
					if (typeof(WeakMap) != "undefined") {
						var weak = new WeakMap();
						return {
							get: function(command) {
								return weak.get(command);
							},
							set: function(command, metadata) {
								weak.set(command, metadata);
							}
						}
					}
					return {
						// Fallback stores metadata by function identity, but does not provide weak-reference retention.
						get: function(command) {
							return command[property];
						},
						set: function(command, metadata) {
							if (Object.prototype.hasOwnProperty.call(command, property)) {
								command[property] = metadata;
							} else {
								Object.defineProperty(command, property, {
									value: metadata,
									enumerable: false,
									configurable: false,
									writable: true
								});
							}
						}
					}
				})();

				var defineCommand = function(command, metadata) {
					metadataStore.set(command, $api.Object.compose(metadataStore.get(command) || {}, metadata));
					return command;
				};

				var getMetadata = function(descriptor, path, command) {
					var fromCommand = metadataStore.get(command) || {};
					var fromPath = (descriptor && descriptor.metadata && descriptor.metadata[path]) ? descriptor.metadata[path] : {};
					return $api.Object.compose(fromCommand, fromPath);
				};

				function getCommandList(rv,commands,prefix) {
					if (!prefix) prefix = "";
					for (var x in commands) {
						if (typeof(commands[x]) == "function") {
							rv.push(prefix + x);
							getCommandList(rv,commands[x],prefix + x + ".");
						} else if (typeof(commands[x]) == "object") {
							getCommandList(rv,commands[x],prefix + x + ".");
						}
					}
				}

				function getCommandItems(descriptor) {
					var rv = [];
					function recurse(commands,prefix) {
						if (!prefix) prefix = "";
						for (var x in commands) {
							var target = commands[x];
							var path = prefix + x;
							if (typeof(target) == "function") {
								rv.push({
									path: path,
									command: target,
									metadata: getMetadata(descriptor, path, target)
								});
								recurse(target, path + ".");
							} else if (typeof(target) == "object") {
								recurse(target, path + ".");
							}
						}
					}
					recurse(descriptor.commands);
					return rv;
				}

				function isHelpArgument(argument) {
					return argument == "--help" || argument == "-h";
				}

				function getHelpRequest(invocation) {
					if (invocation.arguments.length == 0) return { type: "index", status: 1 };
					if (isHelpArgument(invocation.arguments[0])) return { type: "index", status: 0 };
					if (invocation.arguments[0] == "help") {
						if (invocation.arguments[1]) return { type: "command", command: invocation.arguments[1], status: 0 };
						return { type: "index", status: 0 };
					}
					for (var i=1; i<invocation.arguments.length; i++) {
						if (isHelpArgument(invocation.arguments[i])) return { type: "command", command: invocation.arguments[0], status: 0 };
					}
				}

				function showUsage() {
					jsh.shell.console("Usage: " + jsh.script.file + " [options] <command> [arguments]");
				}

				function getSummary(metadata) {
					return (metadata.summary) ? metadata.summary : "(no description)";
				}

				function renderIndex(descriptor) {
					var items = getCommandItems(descriptor).filter(function(item) {
						return !item.metadata.hidden;
					});
					var hasCategories = items.some(function(item) {
						return Boolean(item.metadata.category);
					});
					showUsage();
					jsh.shell.console("");
					jsh.shell.console("Available commands:");
					jsh.shell.console("");
					if (hasCategories) {
						var categories = [];
						var byCategory = {};
						items.forEach(function(item) {
							var category = item.metadata.category || "Other";
							if (!byCategory[category]) {
								byCategory[category] = [];
								categories.push(category);
							}
							byCategory[category].push(item);
						});
						categories.forEach(function(category,index) {
							if (index > 0) jsh.shell.console("");
							jsh.shell.console(category + ":");
							byCategory[category].forEach(function(item) {
								jsh.shell.console("  " + item.path + " - " + getSummary(item.metadata));
							});
						});
					} else {
						items.forEach(function(item) {
							jsh.shell.console(item.path + " - " + getSummary(item.metadata));
						});
					}
				}

				function renderCommandHelp(descriptor, path) {
					var call = getCommand({
						commands: descriptor.commands,
						invocation: {
							options: {},
							arguments: [path]
						}
					});
					if ($api.Error.old.isType(jsh.script.cli.error.TargetNotFound)(call)) {
						jsh.shell.console("Command not found: " + path);
						jsh.shell.console("");
						renderIndex(descriptor);
						return 1;
					}
					if ($api.Error.old.isType(jsh.script.cli.error.TargetNotFunction)(call)) {
						jsh.shell.console("Command is not function: " + path + " is " + call.target);
						return 1;
					}
					var found = /** @type { slime.jsh.script.cli.Call<{}> } */ (call);
					var metadata = getMetadata(descriptor, path, found.command);
					jsh.shell.console("Usage: " + jsh.script.file + " " + path + (metadata.args ? " " + metadata.args : " [arguments]"));
					jsh.shell.console("");
					jsh.shell.console(getSummary(metadata));
					if (metadata.deprecated) {
						jsh.shell.console("");
						jsh.shell.console("Deprecated: " + metadata.deprecated);
					}
					if (metadata.description) {
						jsh.shell.console("");
						jsh.shell.console(metadata.description);
					}
					if (metadata.options) {
						jsh.shell.console("");
						jsh.shell.console("Options:");
						metadata.options.forEach(function(option) {
							jsh.shell.console("  " + option);
						});
					}
					if (metadata.examples) {
						jsh.shell.console("");
						jsh.shell.console("Examples:");
						metadata.examples.forEach(function(example) {
							jsh.shell.console("  " + example);
						});
					}
					return 0;
				}

				function handleHelp(descriptor, invocation) {
					var request = getHelpRequest(invocation);
					if (!request) return false;
					if (request.type == "index") {
						renderIndex(descriptor);
					} else {
						request.status = renderCommandHelp(descriptor, request.command);
					}
					jsh.shell.exit(request.status);
					return true;
				}

				/** @type { slime.jsh.script.cli.Exports["Call"]["parse"] } */
				function getCommand(p) {
					var command = p.invocation.arguments[0];
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
							path: command,
							command: referenced,
							invocation: {
								options: p.invocation.options,
								arguments: p.invocation.arguments.slice(1)
							}
						}
					}
				}

				/** @type { slime.jsh.script.cli.Exports["Call"]["get"] } */
				var getCall = function(p) {
					/** @type { slime.jsh.script.cli.Processor<{},{}> } */
					var emptyOptions = $api.fp.identity;

					var options = p.descriptor.options || emptyOptions;
					var global = options({ options: {}, arguments: p.arguments });
					var call = getCommand({
						invocation: global,
						commands: p.descriptor.commands
					});
					//	TODO	something to do with generics
					//@ts-ignore
					return call;
				}

				/** @type { slime.jsh.script.cli.Exports["Call"]["execute"] } */
				var executeCall = function(p) {
					var commands = p.commands;
					var call = p.call;

					function showCommands() {
						if (p.descriptor) {
							renderIndex(p.descriptor);
							return;
						}
						var rv = [];
						getCommandList(rv, commands);
						jsh.shell.console("Available commands:");
						jsh.shell.console("");
						rv.forEach(function(item) {
							jsh.shell.console(item);
						});
					}

					var isTargetNotFunction = $api.Error.old.isType(jsh.script.cli.error.TargetNotFunction);

					if ($api.Error.old.isType(jsh.script.cli.error.NoTargetProvided)(call)) {
						showUsage();
						jsh.shell.console("");
						showCommands();
						jsh.shell.exit(1);
					} else if ($api.Error.old.isType(jsh.script.cli.error.TargetNotFound)(call)) {
						jsh.shell.console("Command not found: " + call.command);
						jsh.shell.console("");
						showCommands();
						jsh.shell.exit(1);
					} else if (isTargetNotFunction(call)) {
						jsh.shell.console("Command is not function: " + call.command + " is " + call.target);
						jsh.shell.exit(1);
					} else {
						try {
							if (p.before) p.before(call);
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

				/** @type { slime.jsh.script.cli.main } */
				var listener;

				jsh.script.cli = {
					main: function(program) {
						if (listener) listener(program);
					},
					listener: function(main) {
						listener = main;
					},
					Call: {
						parse: getCommand,
						get: getCall,
						execute: executeCall
					},
					program: function(p) {
						return function(invocation) {
							var descriptor = {
								commands: p.commands,
								metadata: p.metadata
							};
							handleHelp(descriptor, invocation);
							var call = getCommand({
								commands: p.commands,
								invocation: invocation
							});
							executeCall({
								commands: p.commands,
								call: call,
								descriptor: descriptor
							});
						}
					},
					execute: function(p) {
						handleHelp(p, p.invocation);
						var call = getCommand({
							commands: p.commands,
							invocation: p.invocation
						});
						jsh.script.cli.Call.execute({
							commands: p.commands,
							call: call,
							descriptor: p
						});
					},
					defineCommand: defineCommand,
					option: {
						string: option($api.fp.identity),
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
							return $api.fp.object.revise(rv);
						},
						number: option(Number),
						pathname: option(jsh.script.getopts.parser.Pathname),
						array: function(o) {
							var rv = function(p) {
								var args = [];
								p.options[o.longname] = [];
								for (var i=0; i<p.arguments.length; i++) {
									//	TODO	the String cast below is more like a TypeScript workaround; should re-examine
									if (o.longname && p.arguments[i] == "--" + String(o.longname)) {
										p.options[o.longname].push(o.value(p.arguments[++i]));
									} else {
										args.push(p.arguments[i]);
									}
								}
								p.arguments = args;
							}
							return $api.fp.object.revise(rv);
						},
						map: function(o) {
							return function(p) {
								var map = {};
								var args = [];
								for (var i=0; i<p.arguments.length; i++) {
									if (o.longname && p.arguments[i] == "--" + String(o.longname)) {
										var next = $api.fp.now(
											p.arguments[++i],
											function(argument) {
												return argument.split("=");
											},
											function(tokens) {
												return {
													name: tokens[0],
													value: o.value(tokens[1])
												}
											}
										);

										map[next.name] = next.value;
									} else {
										args.push(p.arguments[i]);
									}
								}
								/** @type { any } */
								var added = {};
								added[o.longname] = map;
								return {
									options: $api.Object.compose(p.options, added),
									arguments: args
								};
							};
						}
					},
					fp: {
						option: {
							location: function(c) {
								return function(p) {
									var rv = {
										/** @type { object } */
										options: $api.Object.compose(p.options),
										arguments: []
									};

									rv.options[c.longname] = $api.fp.Maybe.from.nothing();

									for (var i=0; i<p.arguments.length; i++) {
										if (p.arguments[i] == ("--" + c.longname)) {
											var value = p.arguments[++i];
											var location = parser.pathname(value).os.adapt();
											rv.options[c.longname] = $api.fp.Maybe.from.some(location);
										} else {
											rv.arguments.push(p.arguments[i]);
										}
									}

									return rv;
								}
							}
						}
					},
					error: {
						NoTargetProvided: $api.Error.old.Type({ name: "NoTargetProvided" }),
						TargetNotFound: $api.Error.old.Type({ name: "TargetNotFound" }),
						TargetNotFunction: $api.Error.old.Type({ name: "TargetNotFunction", extends: TypeError })
					},
					parser: parser,
					/**
					 * @template { any } T
					 * @param { slime.jsh.script.cli.Processor<T> } f
					 */
					invocation: function(f) {
						/** @type { slime.js.Cast<T> } */
						var cast = $api.fp.cast.unsafe;
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
						/** @type { slime.jsh.script.cli.Processor<{},{}> } */
						var emptyOptions = $api.fp.identity;
						var options = descriptor.options || emptyOptions;
						var invocation = options({ options: {}, arguments: jsh.script.arguments.slice() });
						handleHelp(descriptor, invocation);
						var call = getCommand({
							commands: descriptor.commands,
							invocation: invocation
						});
						executeCall({
							commands: descriptor.commands,
							call: call,
							before: descriptor.before,
							descriptor: descriptor
						});
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
			}
		});

		/** @type { slime.jsh.script.internal.loader_old.Script } */
		var loader_old = $loader.script("plugin-loader-old.js");
		loader_old()(plugin, jsh);
	}
//@ts-ignore
)(Packages,plugins,plugin,$slime,$api,jsh,$loader)
