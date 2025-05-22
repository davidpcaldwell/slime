//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { { jsh: Partial<slime.jsh.Global> } } global
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.jrunscript.native.inonit.script.jsh.Shell } $jsh
	 */
	function(global,Packages,JavaAdapter,$jsh) {
		var internal = {
			/** @type { (status: number) => never } */
			exit: void(0),
			/** @type { string[] } */
			arguments: void(0),
			deprecate: void(0)
		};

		global.jsh = new function() {
			var $slime = (
				/**
				 *
				 * @param { slime.jrunscript.native.inonit.script.jsh.Shell } $jsh
				 * @returns { slime.jsh.plugin.$slime }
				 */
				function($jsh) {
					var configuration = $jsh.getEnvironment();

					/**
					 * @type { slime.jsh.plugin.Stdio }
					 */
					var stdio = (function() {
						var out = new Packages.java.io.PrintStream(configuration.getStdio().getStandardOutput());
						var err = new Packages.java.io.PrintStream(configuration.getStdio().getStandardError());

						return {
							getStandardInput: function() {
								return configuration.getStdio().getStandardInput();
							},

							getStandardOutput: function() {
								return out;
							},

							getStandardError: function() {
								return err;
							}
						}
					})();

					var invocation = $jsh.getInvocation();

					internal.arguments = (function(_invocation) {
						var _arguments = _invocation.getArguments();
						var rv = [];
						for (var i=0; i<_arguments.length; i++) {
							rv.push(String(_arguments[i]));
						}
						return rv;
					})(invocation);

					// $jsh.runtime() is essentially a SLIME Java runtime object, augmented by jsh/loader/rhino.js or jsh/loader/nashorn.js
					var runtime = $jsh.runtime();

					return Object.assign(
						runtime,
						{
							getEnvironment: function() {
								return configuration.getEnvironment();
							},
							//	Could consider returning empty string for null; this seems to be the way properties are used
							getSystemProperty: function(name) {
								var _rv = configuration.getSystemProperties().getProperty(name);
								if (_rv === null) return null;
								return String(_rv);
							},
							getSystemProperties: function() {
								return configuration.getSystemProperties();
							},
							getInvocation: function() {
								return invocation;
							},
							getPackaged: function() {
								return $jsh.getPackaged();
							},
							loader: (function() {
								var getLoaderCode = function(path) {
									var _reader = $jsh.getJshLoader().getFile(path).getReader();
									return String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
								};

								return Object.assign(
									{},
									runtime.old.loader,
									runtime.loader,
									{
										getLoaderScript: function(path) {
											return new $slime.Resource({
												name: "jsh://" + path,
												read: $slime.Resource.ReadInterface.string(getLoaderCode(path))
											});
										}
									}
								);
							})(),
							getLibraryFile: function(path) {
								return $jsh.getLibraryFile(path);
							},
							getInterface: function() {
								return $jsh.getInterface();
							},
							getStdio: function() {
								return stdio;
							},
							coffee: $jsh.getLibrary("coffee-script.js"),
							//	Assigned after loading plugin implementation
							plugins: void(0)
						}
					);
				}
			)($jsh);

			internal.exit = $slime.exit;

			(function initializeDeprecation() {
				//	TODO	The name prefix used below is duplicative of the one in js/debug/plugin.jsh.js, so not DRY currently
				var _log = function(_logger,_level,mask) {
					var substitutions = Array.prototype.slice.call(arguments,3);
					if (_logger.isLoggable(_level)) {
						var _message = Packages.java.lang.String.format(mask, substitutions);
						_logger.log(_level, _message);
					}
				}

				var javaLogName = "inonit.script.jsh.Shell.log.$api.deprecate";

				$slime.$api.deprecate.warning = function(o) {
					var name = javaLogName;
					var _level = Packages.java.util.logging.Level.WARNING;
					var _logger = Packages.java.util.logging.Logger.getLogger(name);
					var _traceLevel = Packages.java.util.logging.Level.FINE;
					if (o.callee) {
						if (o.object && o.property) {
							_log(_logger, _level, "Use of deprecated method %s of object %s", String(o.property), String(o.object));
						} else {
							_log(_logger, _level, "Use of deprecated function %s", String(o.callee));
						}
					} else if (o.object && o.property) {
						_log(_logger, _level, "Access to deprecated property %s of object %s", String(o.property), String(o.object));
					}
					if (_logger.isLoggable(_traceLevel)) {
						//	TODO	disable break on error
						_log(_logger, _traceLevel, "Stack trace of deprecated usage:\n%s", String(new Error().stack));
					}
					debugger;
				};
			})();

			internal.deprecate = $slime.$api.deprecate;

			var plugins = (
				function(jsh) {
					/** @type { slime.jsh.internal.loader.plugins.Export } */
					var exported;
					$slime.run(
						$slime.loader.getLoaderScript("plugins.js"),
						{
							$slime: $slime,
							jsh: jsh,
							$export: function(v) {
								exported = v;
							}
						}
					);
					return exported;
				}
			)(this);

			$slime.plugins = {
				mock: function(p) {
					return plugins.mock(p);
				}
			};

			this.loader = (
				/**
				 *
				 * @returns { slime.jsh.loader.Exports }
				 */
				function() {
					/** @type { (from: any) => from is slime.jrunscript.file.Pathname } */
					var isPathname = function(from) { return Boolean(from && from.java && from.java.adapt && $slime.classpath.getClass("java.io.File").isInstance(from.java.adapt())) };
					/** @type { (from: any) => from is slime.jrunscript.file.Directory } */
					var isDirectory = function(from) { return Boolean(from && from.pathname && from.pathname.directory); };
					/** @type { (from: any) => from is slime.jrunscript.file.File } */
					var isFile = function(from) { return Boolean(from && from.pathname && from.pathname.file); };
					/** @type { (from: any) => from is slime.runtime.loader.Synchronous } */
					var isSynchronousLoader = function(from) { return Boolean(from.get) && Boolean(from.code); };
					/** @type { (from: any) => from is slime.old.Loader } */
					var isOldLoader = function(from) { return Boolean(from.get) && !Boolean(from.code); };

					/**
					 *
					 * @param {*} code
					 * @returns { slime.Resource }
					 */
					var getCode = function(code) {
						if (typeof(code) == "undefined") throw new TypeError("'code' must not be undefined.");
						if (code === null) throw new TypeError("'code' must not be null.");
						//	This check determines whether the object is a Pathname; is there a way to do that in the rhino/file module itself?
						//	TODO	presumably the run/file methods should only support file objects, not directories or pathnames not
						//			corresponding to files ... or else what should they do if the file is not found? Maybe file could return
						//			null or something ... but run would probably have to fail silently, which is not good unless it is
						//			explicitly specified
						if (isPathname(code)) {
							return new $slime.Resource({
								name: code.toString(),
								read: $slime.Resource.ReadInterface.string(
									(function() {
										var _in = new Packages.java.io.FileInputStream(code.java.adapt());
										var rv = String(new Packages.inonit.script.runtime.io.Streams().readString(_in));
										return rv;
									})()
								)
							});
						} else {
							if (typeof(code.read) == "function") return code;
							if (typeof(code.string) == "string") {
								return $slime.$api.deprecate(function() {
									return new $slime.Resource({
										name: code.name,
										type: code.type,
										read: {
											string: function() { return code.string; }
										}
									});
								})();
							}
							return new $slime.Resource(code);
						}
					};

					function kotlin() {
						var KOTLIN = $slime.getLibraryFile("kotlin/lib");

						var _libraries = KOTLIN.listFiles();

						//	Probably an API above available to convert Java array to JS
						//	A previous implementation used selected libraries but given the experimental nature of these APIs it
						//	seems best to anticipate the library structures to evolve
						var libraries = [];
						for (var i=0; i<_libraries.length; i++) {
							libraries.push(_libraries[i]);
						}

						//	TODO	duplicates jsh.file.Searchpath; could push that logic up
						Packages.java.lang.System.setProperty("kotlin.script.classpath", libraries.map(function(library) {
							return String(library.getCanonicalPath());
						}).join(String(Packages.java.io.File.pathSeparator)));

						libraries.forEach(function(library) {
							$slime.classpath.add({ _file: library });
						});

						var factory = new Packages.org.jetbrains.kotlin.mainKts.jsr223.KotlinJsr223MainKtsScriptEngineFactory();

						return {
							run: function(code,scope) {
								var _context = Packages.java.lang.Thread.currentThread().getContextClassLoader();
								$slime.classpath.setAsThreadContextClassLoaderFor(Packages.java.lang.Thread.currentThread());
								//Packages.java.lang.Thread.currentThread().setContextClassLoader($slime.classpath);
								var kotlinc = factory.getScriptEngine();

								for (var x in scope) {
									if (x != "bindings") throw new TypeError("Unsupported: scope variable other than 'bindings': " + x);
								}
								for (var x in scope.bindings) {
									kotlinc.put(x, scope.bindings[x]);
								}
								var resource = getCode(code);
								var string = resource.read(String);
								var result = kotlinc.eval(string);
								Packages.java.lang.Thread.currentThread().setContextClassLoader(_context);
								return result;
							}
						};
					}

					/** @type { (code: any) => code is slime.jrunscript.file.Node } */
					var isNode = function(code) {
						return isFile(code) || isDirectory(code);
					}

					//	TODO	the run, value, and file properties below are later decorated by jsh/script/plugin-loader-old.js,
					//			for some reason; that decoration should probably move to this file, perhaps in a separate plugin

					return {
						run: function(code,scope,target) {
							//	TODO	untested
							if (isNode(code)) code = code.pathname;
							return $slime.run(getCode(code),scope,target);
						},
						//	TODO	seems to be undocumented in type system, may be unused
						value: function(code,scope,target) {
							//	TODO	untested
							if (isNode(code)) code = code.pathname;
							return $slime.value(getCode(code),scope,target);
						},
						file: function(code,$context) {
							//	TODO	untested
							if (isNode(code)) code = code.pathname;
							return $slime.file(getCode(code),$context);
						},
						module: function(pathname) {
							var format = {};
							if (isNode(pathname)) pathname = pathname.pathname;
							if (isPathname(pathname) && pathname.directory) {
								if (!pathname.directory.getFile("module.js")) {
									return null;
								}
								format.base = pathname.java.adapt();
								format.name = "module.js";
							} else if (isPathname(pathname) && pathname.file && /\.slime$/.test(pathname.basename)) {
								format.slime = pathname.java.adapt();
								format.name = "module.js";
							} else if (isPathname(pathname) && pathname.file) {
								format.base = pathname.parent.java.adapt();
								format.name = pathname.basename;
							} else {
								return null;
							}
							var p = {};
							if (arguments.length == 2) {
								p.$context = arguments[1];
							}
							var loader = (function(format) {
								if (format.slime) return new $slime.Loader({ zip: { _file: format.slime } });
								if (format.base) return new $slime.Loader({ _file: format.base });
								throw new TypeError("Unreachable code: format.slime and format.base null in jsh loader's module()");
							})(format);
							if (format.slime) {
								$slime.classpath.add({ slime: { loader: loader } });
							}
							var args = [format.name].concat(Array.prototype.slice.call(arguments,1));
							return loader.module.apply(loader,args);
						},
						worker: (
							function() {
								/** @type { (source: any, _event: any) => slime.$api.Event<any> } */
								var toEvent = function(source,_event) {
									return {
										type: "message",
										source: source,
										path: [],
										timestamp: new Date().getTime(),
										detail: JSON.parse(_event.json())
									}
								};

								return {
									create: function(p) {
										//Packages.java.lang.System.err.println("running " + p.script);
										return (function() {
											var _delegate = $jsh.worker(
												p.script.pathname.java.adapt(),
												(function() {
													var rv = Packages.java.lang.reflect.Array.newInstance(
														$slime.java.toNativeClass(Packages.java.lang.String),
														p.arguments.length
													);
													for (var i=0; i<p.arguments.length; i++) {
														rv[i] = new Packages.java.lang.String(p.arguments[i]);
													}
													return rv;
												})(),
												new JavaAdapter(
													Packages.inonit.script.jsh.Shell.Event.Listener,
													{
														on: function(e) {
															p.onmessage(
																toEvent(
																	rv,
																	e
																)
															);
														}
													}
												)
											);

											var rv = {
												toString: function() {
													return String(_delegate.toString());
												},
												postMessage: function(v) {
													var json = JSON.stringify(v);
													//Packages.java.lang.System.err.println("Posting message to " + _delegate + ": " + json);
													_delegate.postMessage(json);
												},
												terminate: function() {
													_delegate.terminate();
												}
											};

											return rv;
										})();
									},
									//	To be used in worker to allow it to receive messages
									onmessage: function(f) {
										$jsh.onMessage(
											new JavaAdapter(
												Packages.inonit.script.jsh.Shell.Event.Listener,
												{
													on: function(event) {
														//Packages.java.lang.System.err.println("Worker script onmessage got " + event);
														f(toEvent(null, event));
													}
												}
											)
										)
									},
									postMessage: function(v) {
										$jsh.postMessage(JSON.stringify(v));
									}
								}
							}
						)(),
						//	TODO	try to bring this back? Would it be legal under Graal threading rules?
						// //	experimental interface and therefore currently undocumented
						addFinalizer: function(f) {
							// $slime.loader.addFinalizer(new JavaAdapter(
							// 	Packages.java.lang.Runnable,
							// 	{
							// 		run: function() {
							// 			f();
							// 		}
							// 	}
							// ));
						},
						java: (
							function() {
								/**
								 * @type { slime.jsh.loader.Exports["java"] }
								 */
								var rv = {
									toString: function() {
										return $slime.classpath.toString();
									},
									add: function(pathname) {
										//	TODO	#1816
										if (pathname["src"]) {
											//@ts-ignore
											$slime.classpath.add(pathname);
										}
										if (!pathname) throw new TypeError("'pathname' must be provided and not undefined or null.");
										if (!pathname.directory && !pathname.file) {
											return;
										}
										$slime.classpath.add({ _file: pathname.java.adapt() });
									},
									getClass: function(name) {
										return $slime.classpath.getClass(name);
									}
								};
								return rv;
							}
						)(),
						plugins: function(from) {
							/**
							 *
							 * @param { slime.jrunscript.file.Pathname } from
							 */
							var loadFromPathname = function(from) {
								if (from.file) {
									//	TODO	the ability for this to be a file is not declared in type definition; seems to be
									//			unused
									//	Should we be sending a script resource, rather than a Java file? Could expose that API in loader/jrunscript/expression.js
									plugins.load({ zip: { _file: from.java.adapt() } });
								} else if (from.directory) {
									plugins.load({ _file: from.java.adapt() });
								} else {
									//	TODO	log a message
								}
							};

							if (isPathname(from)) {
								loadFromPathname(from);
							} else if (isFile(from) || isDirectory(from)) {
								loadFromPathname(from.pathname);
							} else if (isSynchronousLoader(from)) {
								plugins.load({ synchronous: from });
							} else if (isOldLoader(from)) {
								plugins.load({ loader: from });
							} else {
								throw new Error("Attempt to load jsh plugins from unknown source: toString() = " + from);
							}
						},
						//	TODO	check semantics; maybe this returns null on non-existence, currently not documented in
						//			slime.jsh.plugin documentation
						kotlin: ($slime.getLibraryFile("kotlin") && $slime.getLibraryFile("kotlin").exists()) ? kotlin() : void(0),
						synchronous: $slime.loader.synchronous,
						Store: $slime.loader.Store
					}
				}
			)();

			(function loadPlugins() {
				var _sources = $slime.getInterface().getPluginSources();
				for (var i=0; i<_sources.length; i++) {
					plugins.load({ loader: new $slime.Loader({ _source: _sources[i] }) });
				}
			})();

			//	TODO	below could be turned into jsh plugin loaded at runtime by jsapi; would need to make getLibrary accessible through
			//			$slime

			if ($slime.getSystemProperties().get("inonit.tools.Profiler.args")) {
				$slime.run($slime.loader.getLoaderScript("profiler.js"), {
					jsh: this,
					_properties: $slime.getSystemProperties()
				});
			}
		};

		/** @type { slime.jsh.script.cli.Program } */
		var main;

		if (!global.jsh.script) throw new Error("Unexpected error loading jsh.script");

		global.jsh.script.cli.listener(
			function(defined) {
				main = defined;
			}
		);

		global.jsh.loader.run(
			{
				name: $jsh.getInvocation().getScript().getSource().getSourceName(),
				read: {
					string: function() {
						//	TODO	this code is repeated inside loader.js; should factor out
						var _reader = $jsh.getInvocation().getScript().getSource().getReader();
						var rv = String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
						if (rv.substring(0,2) == "#!") {
							rv = "//" + rv;
						}
						return rv;
					}
				}
			},
			Object.assign({}, this, {
				main: internal.deprecate(function(supplied) {
					global.jsh.script.cli.main(supplied);
				})
			}),
			this
		);

		if (main) {
			var status = main({
				options: {},
				arguments: internal.arguments
			});
			if (typeof(status) == "number") {
				internal.exit(status);
			}
		}

		$jsh.events();
	}
//@ts-ignore
)(this,Packages,JavaAdapter,$jsh);
