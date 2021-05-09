//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { { jsh: any } } global
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { slime.jrunscript.native.inonit.script.jsh.Shell } $jsh
	 */
	function(global,Packages,JavaAdapter,$jsh) {
		global.jsh = new function() {
			var $slime = (
				/**
				 *
				 * @param { slime.jrunscript.native.inonit.script.jsh.Shell } $jsh
				 * @returns { slime.jsh.plugin.$slime }
				 */
				function($jsh) {
					var configuration = $jsh.getEnvironment();
					var invocation = $jsh.getInvocation();

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

					// $jsh.runtime() is essentially a SLIME Java runtime object, augmented by jsh/loader/rhino.js or jsh/loader/nashorn.js
					return Object.assign(
						$jsh.runtime(),
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

								return {
									getLoaderScript: function(path) {
										return new $slime.Resource({
											name: "jsh://" + path,
											string: getLoaderCode(path)
										});
									}
								};
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

			var plugins = $slime.value(
				$slime.loader.getLoaderScript("plugins.js"),
				{
					$slime: $slime,
					jsh: this
				}
			);

			$slime.plugins = {
				mock: function(p) {
					return plugins.mock(p);
				}
			};

			this.loader = (
				function() {
					var getCode = function(code) {
						if (typeof(code) == "undefined") throw new TypeError("'code' must not be undefined.");
						if (code === null) throw new TypeError("'code' must not be null.");
						//	This check determines whether the object is a Pathname; is there a way to do that in the rhino/file module itself?
						//	TODO	presumably the run/file methods should only support file objects, not directories or pathnames not
						//			corresponding to files ... or else what should they do if the file is not found? Maybe file could return
						//			null or something ... but run would probably have to fail silently, which is not good unless it is
						//			explicitly specified
						if (code.java && code.java.adapt() && $slime.classpath.getClass("java.io.File").isInstance(code.java.adapt())) {
							return new $slime.Resource({
								name: code.toString(),
								string: (function() {
									var _in = new Packages.java.io.FileInputStream(code.java.adapt());
									var rv = String(new Packages.inonit.script.runtime.io.Streams().readString(_in));
									return rv;
								})()
							});
						} else {
							if (typeof(code.read) == "function") return code;
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

					return {
						run: function(code,scope,target) {
							//	TODO	untested
							if (typeof(code.directory) == "boolean") {
								code = code.pathname;
							}
							return $slime.run(getCode(code),scope,target);
						},
						//	TODO	seems to be undocumented in type system, may be unused
						value: function(code,scope,target) {
							//	TODO	untested
							if (typeof(code.directory) == "boolean") {
								code = code.pathname;
							}
							return $slime.value(getCode(code),scope,target);
						},
						file: function(code,$context) {
							//	TODO	untested
							if (typeof(code.directory) == "boolean") {
								code = code.pathname;
							}
							return $slime.file(getCode(code),$context);
						},
						module: function(pathname) {
							var format = {};
							if (typeof(pathname.directory) == "boolean") {
								pathname = pathname.pathname;
							}
							if (pathname.directory) {
								if (!pathname.directory.getFile("module.js")) {
									return null;
								}
								format.base = pathname.java.adapt();
								format.name = "module.js";
							} else if (pathname.file && /\.slime$/.test(pathname.basename)) {
								format.slime = pathname.java.adapt();
								format.name = "module.js";
							} else if (pathname.file) {
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
						worker: function(p) {
							Packages.java.lang.System.err.println("running " + p.script);
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
										Packages.inonit.script.jsh.Shell.Worker.Listener,
										{
											on: p.onmessage
										}
									)
								);

								return {
									toString: function() {
										return String(_delegate.toString());
									},
									postMessage: function(v) {
										var json = JSON.stringify(v);
										Packages.java.lang.System.err.println("Posting message to _delegate: " + json);
									}
								};
							})();
						},
						events: function() {
						},
						namespace: function(name) {
							return $slime.namespace(name);
						},
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
						java: new function() {
							this.toString = function() {
								return $slime.classpath.toString();
							}

							this.add = function(pathname) {
								if (!pathname) throw new TypeError("'pathname' must be provided and not undefined or null.");
								if (!pathname.directory && !pathname.file) {
									return;
								}
								$slime.classpath.add({ _file: pathname.java.adapt() });
							};

							this.getClass = function(name) {
								return $slime.classpath.getClass(name);
							}
						},
						plugins: function(from) {
							var isPathname = from && from.java && from.java.adapt && $slime.classpath.getClass("java.io.File").isInstance(from.java.adapt());
							var isFile = from && from.pathname && from.pathname.file;
							var isDirectory = from && from.pathname && from.pathname.directory;
							if (isPathname) {
								if (from.file) {
									plugins.load({ zip: { _file: from.java.adapt() } });
								} else if (from.directory) {
									plugins.load({ _file: from.java.adapt() });
								} else {
									//	TODO	log a message
								}
							} else if (from && from.get) {
								plugins.load({ loader: from });
							} else if (isFile) {
								//	Should we be sending a script resource, rather than a Java file? Could expose that API in loader/jrunscript/expression.js
								plugins.load({ zip: { _file: from.pathname.java.adapt() } });
							} else if (isDirectory) {
								plugins.load({ _file: from.pathname.java.adapt() });
							}
						},
						//	TODO	check semantics; maybe this returns null on non-existence, currently not documented in jsh/loader/plugin.api.html
						kotlin: ($slime.getLibraryFile("kotlin") && $slime.getLibraryFile("kotlin").exists()) ? kotlin() : void(0)
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

		global.jsh.loader.run(
			{
				name: $jsh.getInvocation().getScript().getSource().getSourceName(),
				string: (function() {
					//	TODO	this code is repeated inside loader.js; should factor out
					var _reader = $jsh.getInvocation().getScript().getSource().getReader();
					var rv = String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
					if (rv.substring(0,2) == "#!") {
						rv = "//" + rv;
					}
					return rv;
				})()
			},
			this,
			this
		);

		$jsh.events();
	}
//@ts-ignore
)(this,Packages,JavaAdapter,$jsh);
