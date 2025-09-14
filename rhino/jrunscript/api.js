//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Exported to script:
//	$api:
//		arguments: array of string containing arguments passed to the script

//	Development:
//	Run tests with jrunscript api.js test/suite.js
//
//	TODO	this script can only be run with JDK Rhino and Nashorn; allow Mozilla Rhino

//@ts-check
(
	/**
	 *
	 * @this { slime.internal.jrunscript.bootstrap.Global<{}> }
	 */
	function() {
		var load = this.load;

		//	TODO	seems to assume the presence of a global function called 'load' -- should handle this more like other global
		//			stuff (see readUrl, readFile), maybe, but is there a potential default implementation for load()? Does Rhino
		//			have load()? Does Graal?
		if (!load) throw new Error("No load()");

		//	Declare local variable for Packages for convenience; will be populated either when JavaClasspath below executes, or
		//	when Nashorn / Graal execute their Mozilla compatibility layer and call JavaClasspath.update()
		/** @type { slime.jrunscript.Packages } */
		var Packages;

		/** @type { slime.jrunscript.JavaAdapter } */
		var JavaAdapter;

		//	TODO	it is possible that the Packages part of this is obsolete. Just tested using the most braindead-simple test case imaginable
		//			local/jdk/8/bin/jrunscript -e "Packages.java.lang.System.err.println('foobarbaz')"
		//			... and Packages appears to be there, in both built-in and standalone Nahorn, even on JDK 8, even without
		//			executing the compatibility script.
		//
		//			In that case, if we test on Graal, I guess we could take the Packages portion of this out? But Graal may need
		// 			it.
		//
		//			In contrast, JavaAdapter is *not* present:
		//			$ local/jdk/8/bin/jrunscript -e "var r = new JavaAdapter(Packages.java.lang.Runnable, { run: function() { print("hey"); } }); r.run()"
		//			script error: ReferenceError: "JavaAdapter" is not defined in <string> at line number 1
		//
		/**
		 * Object which helps bootstrap interfacing with Java classes before the compatible-with-all `Packages` implementation is
		 * present (for example, before Nashorn or GraalVM have executed their Rhino compatibility scripts.)
		 */
		var JavaClasspath = (
			function(global) {
				/** @type { slime.internal.jrunscript.bootstrap.JavaClasspath } */
				var rv = {
					liveconnect: function(name) {
						if (global.Packages[name]) return global.Packages[name];
						if (global.Java) return global.Java.type(name);
					},
					nativeClass: function(name) {
						if (global.Packages) {
							try {
								return global.Packages.java.lang.Class.forName(name);
							} catch (e) {
								return null;
							}
						}
						if (global.Java) return global.Java.type(name).class;
					},
					update: function() {
						Packages = global.Packages;
						JavaAdapter = global.JavaAdapter;
					}
				};
				rv.update();
				return rv;
			}
		)(this);

		//	The below would initialize the logging configuration to be empty, rather than the JDK default. The only logging done is for
		//	remote shells, which otherwise would produce an uncomfortably long silence before the program started running. So they are
		//	instead a little bit chatty. A user could configure this by configuring Java logging. Alternatively, I suppose we could
		//	provide a way to configure it by providing the ability to configure it via a URL for a logging properties file

		//	If it were ever uncommented, we'd want to remove all the `Packages` references and use `JavaClasspath` above.

		// (function initializeLogging() {
		// 	var System = Packages.java.lang.System;
		// 	var set = (System.getProperty("java.util.logging.config.file") != null || System.getProperty("java.util.logging.config.class") != null);
		// 	if (!set) {
		// 		try {
		// 			var properties = new Packages.java.util.Properties();
		// 			var buffer = new Packages.java.io.ByteArrayOutputStream();
		// 			properties.store(buffer, null);
		// 			buffer.close();
		// 			var encoded = buffer.toByteArray();
		// 			var stream = new Packages.java.io.ByteArrayInputStream(encoded);
		// 			Packages.java.util.logging.LogManager.getLogManager().readConfiguration(stream);
		// 			stream.close();
		// 		} catch (e) {
		// 			Packages.java.lang.System.err.println(e);
		// 			Packages.java.lang.System.err.println(e.stack);
		// 			throw new Packages.java.lang.RuntimeException("Unreachable");
		// 		}
		// 	}
		// })();

		/** @type { (p: any) => slime.internal.jrunscript.bootstrap.Configuration } */
		function asInitialConfiguration(p) { return p; }

		/** @type { slime.internal.jrunscript.bootstrap.Configuration } */
		var configuration = asInitialConfiguration(this["$api"]);

		/**
		 * @type { slime.internal.jrunscript.bootstrap.Global<{},{}>["$api"] }
		 */
		var $api = {
			debug: void(0),
			console: void(0),
			log: void(0),
			engine: void(0),
			github: void(0),
			script: void(0),
			rhino: void(0),
			nashorn: void(0),
			java: void(0),
			arguments: void(0),
			shell: void(0),
			io: void(0),
			Script: void(0),
			embed: void(0)
		};

		(
			/** @this { slime.internal.jrunscript.bootstrap.Global } */
			function defineLogging() {
				var on = false;

				var console = function(message) {
					JavaClasspath.liveconnect("java.lang.System").err.println(message);
				}

				var log = function(message,level) {
					JavaClasspath.liveconnect("java.util.logging.Logger").getLogger("inonit.jrunscript").log(
						JavaClasspath.liveconnect("java.util.logging.Level")[level],
						message
					);
				}

				//	TODO	could define an Object.assign-like function here and then use it to build the implementation to satisfy
				//			TypeScript, but not right now.
				$api.debug = (
					function() {
						var rv = function(message) {
							//	TODO	right now the debug property can be either a function or a boolean initially, and then we don't
							//			manage the state super-well after that. Revisit.
							//@ts-ignore
							if (configuration && typeof(configuration.debug) == "function") configuration.debug(message);
							if (on) console(message);
							log(message,"FINE");
						};

						//	TODO	determine whether this if is necessary, may be true that all platforms support it
						if (Object.defineProperty) {
							Object.defineProperty(rv, "on", {
								enumerable: true,
								get: function() {
									return on;
								},
								set: function(v) {
									on = v;
								}
							});
						}

						return rv;
					}
				)();

				if (configuration && configuration.debug) {
					on = true;
					$api.debug("Debug enabled via $api.debug configuration value");
				}

				$api.console = console;

				$api.log = function(message) {
					log(message,"INFO");
				}
			}
		).call(this);

		/**
		 * Information about Rhino as it pertains to the currently running script.
		 */
		var rhino = (
			function(global) {
				var isPresent = function() {
					return JavaClasspath.nativeClass("org.mozilla.javascript.Context") != null;
				};
				var isRunning = function() {
					return JavaClasspath.liveconnect("org.mozilla.javascript.Context").getCurrentContext();
				}
				return {
					/**
					 * Whether Rhino is available on the current classpath.
					 */
					isPresent: isPresent,
					/**
					 * If Rhino is executing the current script, the Rhino `org.mozilla.javascript.Context` in which this script is
					 * executing.
					 */
					running: isRunning,
					/**
					 * If Rhino is on the classpath, the file from which it can be loaded.
					 */
					classpath: function() {
						var File = JavaClasspath.liveconnect("java.io.File");
						return (isPresent()) ? new File(
							JavaClasspath.nativeClass("org.mozilla.javascript.Context")
								.getProtectionDomain().getCodeSource().getLocation().toURI()
						) : null;
					}
				}
			}
		)(this);

		/**
		 * Information about Nashorn as it pertains to the currently running script.
		 */
		var nashorn = (
			/** @returns { slime.internal.jrunscript.bootstrap.Api<{}>["engine"]["nashorn"] } */
			function() {
				//	TODO	A little bit of this logic is duplicated in loader/jrunscript/nashorn.js; we could make this method
				//			available there somehow, perhaps, although it might be tricky getting things organized between
				//			bootstrapping Nashorn in the loader and loading the launcher bootstrap script
				/** @type { { type: slime.jrunscript.Packages["jdk"]["nashorn"]["internal"]["runtime"]["Context"], method: any } } */
				var engine = (
					function() {
						var rv = JavaClasspath.nativeClass("jdk.nashorn.internal.runtime.Context");
						if (rv) {
							return {
								type: Packages.jdk.nashorn.internal.runtime.Context,
								method: rv.getMethod("getContext")
							};
						}
						rv = JavaClasspath.nativeClass("org.openjdk.nashorn.internal.runtime.Context");
						if (rv) {
							return {
								type: Packages.org.openjdk.nashorn.internal.runtime.Context,
								method: rv.getMethod("getContext")
							};
						}
					}
				)();

				var isPresent = function() {
					var ScriptEngineManager = JavaClasspath.liveconnect("javax.script.ScriptEngineManager");
					return Boolean(new ScriptEngineManager().getEngineByName("nashorn"));
				}

				return {
					isPresent: isPresent,
					running: function() {
						if (engine) {
							try {
								return engine.method.invoke(null);
							} catch (e) {
								return null;
							}
						} else {
							return null;
						}
					}
				}
			}
		)();

		/**
		 * The currently executing JavaScript engine. For the `jsh` launcher, this should always be Nashorn in the current design.
		 * But `jsh` also embeds the bootstrap API in the shell, so in those cases, any of these engines could be present.
		 *
		 * @type { slime.internal.jrunscript.bootstrap.internal.Engine }
		 */
		var $engine = (function(global) {
			var Nashorn = function() {
				this.toString = function() {
					return "Nashorn";
				}
			};

			var Rhino = function() {
				this.toString = function() {
					return "Rhino";
				}
			}

			var Graal = function() {
				this.toString = function() {
					return "Graal";
				}
			};

			var JdkRhino = function() {
				this.toString = function() {
					return "JSR-223 Rhino";
				}
			}

			var engines = {
				nashorn: new Nashorn(),
				rhino: new Rhino(),
				graal: new Graal(),
				jdkrhino: new JdkRhino()
			};

			var name = (function() {
				if (this.Graal) {
					return "graal";
				} if (rhino.isPresent() && rhino.running()) {
					//	TODO	untested
					return "rhino";
				} else if (new global.Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
					return "nashorn";
				} else {
					return "jdkrhino";
				}
			})();

			var rv = engines[name];
			rv.resolve = function(options) {
				return options[name];
			};

			var rhinoStackPattern = /^(?:\s+)(?:at )(.*)\:(\d+)(?: \(.*\))?$/;

			var rhinoStackFrames = function(string) {
				var LINE_SEPARATOR = String(global.Packages.java.lang.System.getProperty("line.separator"));
				var trace = string.split(LINE_SEPARATOR);
				var rv = [];
				for (var i=0; i<trace.length; i++) {
					if (trace[i].length) {
						var match = rhinoStackPattern.exec(trace[i]);
						if (match) {
							rv.push({ file: match[1] });
						}
					}
				}
				return rv;
			};

			var graalStackPattern = /^(?:\s+)(?:at (\S+) )\((.*)\:(\d+)\)$/

			rv.getCallingScript = rv.resolve({
				nashorn: function() {
					var trace = new global.Packages.java.lang.Throwable().getStackTrace();
					for (var i=0; i<trace.length; i++) {
						$api.debug(i + ": " + trace[i]);
					}
					return trace[2].getFileName();
				},
				rhino: function() {
					var stackTrace = String(new global.Packages.org.mozilla.javascript.WrappedException(new global.Packages.java.lang.RuntimeException()).getScriptStackTrace());
					$api.debug("rhino trace = [" + stackTrace + "]");
					var frames = rhinoStackFrames(stackTrace);
					$api.debug("frames = " + JSON.stringify(frames));
					return (frames.length > 2) ? frames[2].file : null;
				},
				graal: function() {
					var stack = new Error().stack;
					var line = stack.split("\n")[3];
					var file = graalStackPattern.exec(line)[2];
					return file;
				},
				jdkrhino: function() {
					throw new Error("Unimplemented.");
				}
			});

			var getScript = rv.resolve({
				nashorn: function() {
					return new global.Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
				},
				rhino: function() {
					var LINE_SEPARATOR = String(global.Packages.java.lang.System.getProperty("line.separator"));
					var trace = String(new global.Packages.org.mozilla.javascript.WrappedException(new global.Packages.java.lang.RuntimeException()).getScriptStackTrace()).split(LINE_SEPARATOR);
					for (var i=0; i<trace.length; i++) {
						if (trace[i].length) {
							var pattern = rhinoStackPattern;
							var parsed = pattern.exec(trace[i]);
							if (!parsed) {
								throw new Error("Rhino stack trace frame [" + trace[i] + " does not match expected pattern: [" + parsed + "]");
							}
							if (/* /api\.js$/.test(parsed[1]) */ true) {
								return parsed[1];
								// return String(new Packages.java.io.File(parsed[1]).getCanonicalPath());
							}
						}
					}
					return null;
				},
				graal: function() {
					// new Packages.java.lang.Throwable().printStackTrace();
					// Packages.java.lang.System.err.println(new Error().stack);
					// Packages.java.lang.System.err.println(new Packages.java.lang.Throwable().getStackTrace()[0].getFileName());
					// Packages.java.lang.System.err.println("sun.java.command = " + Packages.java.lang.System.getProperty("sun.java.command"));
					var command = global.Packages.java.lang.System.getProperty("sun.java.command");
					var main = (function() {
						var tokens = String(command).split(" ");
						for (var i=1; i<tokens.length; i++) {
							var token = tokens[i];
							if (token == "--js.nashorn-compat=true") continue;
							return token;
						}
					})();
					return main;
					// Packages.java.lang.System.err.println("main = " + main);
					// throw new Error("Unimplemented: script for Graal");
				},
				jdkrhino: function() {
					return global[String(global.Packages.javax.script.ScriptEngine.FILENAME)];
				}
			});

			$api.debug("Getting main engine script ...");
			rv.script = getScript();

			$api.debug("Main engine script is [" + rv.script + "]");
			rv.newArray = function(type,length) {
				var argument = this.resolve({
					nashorn: function() {
						return type["class"];
					},
					rhino: function() {
						return type;
					},
					jdkrhino: function() {
						return type;
					}
				})();
				return global.Packages.java.lang.reflect.Array.newInstance(argument,length);
			}
			rv.getClass = function(name) {
				//	TODO	does not detect whether this evaluates to JavaPackage
				var jclass = eval("Packages." + name);
				return this.resolve({
					nashorn: function() {
						return jclass["class"];
					},
					graal: function() {
						return jclass["class"];
					},
					rhino: function() {
						return jclass;
					},
					jdkrhino: function() {
						return jclass;
					}
				})();
			};
			rv.resolve({
				nashorn: function() {
					load("nashorn:mozilla_compat.js");
					JavaClasspath.update();
				},
				jdkrhino: function() {
				},
				rhino: function() {
				},
				graal: function() {
					load("nashorn:mozilla_compat.js");
					JavaClasspath.update();
				}
			})();
			return rv;
		})(this);

		if (configuration && configuration.engine && configuration.engine.script) {
			$engine.script = configuration.engine.script;
		}

		$api.engine = (
			function(global) {
				return {
					toString: function() {
						return $engine.toString();
					},
					resolve: function(p) {
						return $engine.resolve(p);
					},
					readUrl: (this.readUrl) ? this.readUrl : function(path) {
						var rv = "";
						var connection = new Packages.java.net.URL(path).openConnection();
						var reader = new Packages.java.io.InputStreamReader(connection.getInputStream());
						var c;
						while((c = reader.read()) != -1) {
							var _character = new Packages.java.lang.Character(c);
							rv += _character.toString();
						}
						return rv;
					},
					//	TODO	much of this is redundant with inonit.system.Command, but we preserve it here because we are trying to remain
					//			dependent only on Rhino, which apparently has a bug(?) making its own runCommand() not work correctly in this
					//			scenario when an InputStream is provided: even when underlying process terminates, command does not return
					//	TODO	this has the potential to run really slowly when written in JavaScript
					//	TODO	Graal cannot correctly run this function because of the multithreading involved; see https://github.com/graalvm/graaljs/issues/30
					runCommand: function() {
						var Buffer = function(initial) {
							var _bytes = new Packages.java.io.ByteArrayOutputStream();

							var string = initial;

							this.stream = _bytes;

							this.finish = function() {
								_bytes.close();
								var _reader = new Packages.java.io.InputStreamReader(new Packages.java.io.ByteArrayInputStream(_bytes.toByteArray()));
								var c;
								while((c = _reader.read()) != -1) {
									string += new Packages.java.lang.Character(c).toString();
								}
								return string;
							}
						}

						var buffers = {};
						var context = new function() {
							var mode;

							this.setMode = function(value) {
								mode = value;
								if (typeof(mode.output) == "string") {
									buffers.output = new Buffer(mode.output);
								}
								if (typeof(mode.err) == "string") {
									buffers.err = new Buffer(mode.err);
								}
							}

							this.environment = function(_environment) {
								if (mode && mode.env) {
									_environment.clear();
									for (var x in mode.env) {
										if (mode.env[x]) {
											_environment.put(new Packages.java.lang.String(x), new Packages.java.lang.String(mode.env[x]));
										}
									}
								} else {
								}
							}

							this.getStandardOutput = function() {
								if (buffers.output) return buffers.output.stream;
								if (mode && mode.output) return mode.output;
								return Packages.java.lang.System.out;
							};
							this.getStandardError = function() {
								if (buffers.err) return buffers.err.stream;
								if (mode && mode.err) return mode.err;
								return Packages.java.lang.System.err;
							};
							this.getStandardInput = function() {
								if (mode && mode.input) return mode.input;
								return new JavaAdapter(
									Packages.java.io.InputStream,
									new function() {
										this.read = function() {
											return -1;
										}
									}
								);
							};

							this.finish = function() {
								if (buffers.output) mode.output = buffers.output.finish();
								if (buffers.err) mode.err = buffers.err.finish();
							}
						}
						var list = new Packages.java.util.ArrayList();
						for (var i=0; i<arguments.length; i++) {
							if (typeof(arguments[i]) == "string") {
								list.add(new Packages.java.lang.String(arguments[i]));
							} else if (i < arguments.length-1) {
								list.add(new Packages.java.lang.String(String(arguments[i])));
							} else {
								//	TODO	in Rhino-compatible runCommand this should only work if it is the last argument
								$api.debug("Setting runCommand mode ...");
								context.setMode(arguments[i]);
							}
						}
						var _builder = new Packages.java.lang.ProcessBuilder(list);
						context.environment(_builder.environment());
						//	TODO	this terminator/buffer stuff seems like it might be really slow; should try to figure out a way to profile it
						//			and speed it up if necessary
						var terminator = (function() {
							var output = new Packages.java.io.ByteArrayOutputStream();
							var writer = new Packages.java.io.OutputStreamWriter(output);
							writer.write(Packages.java.lang.System.getProperty("line.separator"));
							writer.flush();
							var bytes = output.toByteArray();
							var rv = [];
							for (var i=0; i<bytes.length; i++) {
								rv[i] = bytes[i];
							}
							return rv;
						})();

						/**
						 *
						 * @param { slime.jrunscript.native.java.io.InputStream } _in
						 * @param { slime.jrunscript.native.java.io.OutputStream } _out
						 * @param { boolean } closeOnEnd
						 * @param { boolean } flush
						 */
						var Spooler = function(_in,_out,closeOnEnd,flush) {
							var buffer = [];

							var bufferIsTerminator = function() {
								for (var i=0; i<terminator.length; i++) {
									if (terminator[i] != buffer[i]) return false;
								}
								return true;
							}

							this.run = function() {
								var i;
								try {
									while( (i = _in.read()) != -1 ) {
										if (flush) {
											if (buffer.length < terminator.length) {
												buffer.push(i);
											} else {
												buffer.shift();
												buffer[buffer.length-1] = i;
											}
										}
										_out.write(i);
										//	TODO	This flush, which essentially turns off buffering, is necessary for at least some classes of
										//			applications that are waiting on input in order to decide how to proceed.
										if (flush || bufferIsTerminator()) {
											_out.flush();
										}
									}
									if (closeOnEnd) {
										_out.close();
									}
								} catch (e) {
									this._e = e;
								}
							}
						};

						/**
						 *
						 * @param { slime.jrunscript.native.java.io.InputStream } _in
						 * @param { slime.jrunscript.native.java.io.OutputStream } _out
						 * @param { boolean } closeOnEnd
						 * @param { boolean } flush
						 * @param { boolean } daemon
						 * @param { string } name
						 */
						Spooler.start = function(_in,_out,closeOnEnd,flush,daemon,name) {
							var s = new Spooler(_in, _out, closeOnEnd,flush);
							//	TODO	Graal has JavaAdapter bug: https://github.com/oracle/graal/issues/541
							var JAdapter = $engine.resolve({
								rhino: JavaAdapter,
								nashorn: JavaAdapter,
								jdkrhino: JavaAdapter,
								//@ts-ignore
								graal: /** @type { slime.jrunscript.JavaAdapter } */(function(type,implementation) {
									return new type(implementation);
								})
							})
							var t = new Packages.java.lang.Thread(
								new JAdapter(
									Packages.java.lang.Runnable,
									s
								)
							);
							$api.debug("Constructed (Spooler.start): " + name);
							t.setName(t.getName() + ": Spooler for " + name);
							t.setDaemon(daemon);
							$api.debug("Starting (Spooler.start): " + name);
							t.start();
							$api.debug("Started (Spooler.start): " + name);
							return t;
						};
						var spoolName = Array.prototype.join.call(arguments, ",");
						$api.debug("Forking a command ... " + Array.prototype.slice.call(arguments).join(" "));
						var delegate = _builder.start();
						$api.debug("Started.");
						var hasConsole = Packages.java.lang.System.console();
						$api.debug("hasConsole = " + Boolean(hasConsole));
						var _in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, !hasConsole, false, "stdout: " + spoolName);
						$api.debug("Started spooler for " + _in);
						var _err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, !hasConsole, false, "stderr: " + spoolName);
						$api.debug("Started spoolers.");
						var _stdin = context.getStandardInput();
						var _out = Spooler.start(_stdin, delegate.getOutputStream(), true, true, true, "stdin from " + _stdin + ": " + spoolName);
						var rv = delegate.waitFor();
						$api.debug("Started; before join()");
						var join = function() {
							_in.join();
							_err.join();
						};
						$engine.resolve({
							rhino: join,
							jdkrhino: join,
							nashorn: join,
							graal: function() {
							}
						})();
						// _in.join();
						// _err.join();
						$api.debug("Started; after join(): alive _in=" + _in.isAlive() + " err=" + _err.isAlive());
						context.finish();
						return rv;
					},
					getCallingScript: function() {
						return $engine.getCallingScript();
					},
					rhino: rhino,
					nashorn: nashorn
				};
			}
		)(this);

		/**
		 * @type { slime.internal.jrunscript.bootstrap.internal.Io }
		 */
		var io = {
			copy: function(from,to) {
				var b;
				while( (b = from.read()) != -1 ) {
					to.write(b);
				}
				to.close();
			},
			zip: {
				parse: function(_stream,destination) {
					var _zipstream = new Packages.java.util.zip.ZipInputStream(_stream);
					/** @type { slime.jrunscript.native.java.util.zip.ZipEntry } */
					var _entry;
					while(_entry = _zipstream.getNextEntry()) {
						var isDirectory = _entry.getName().endsWith(new Packages.java.lang.String("/"));
						var name = String(_entry.getName());
						if (isDirectory) {
							destination.directory(name);
						} else {
							destination.write(name,_zipstream);
						}
					}
					_stream.close();
				}
			},
			/** @type { (_stream: slime.jrunscript.native.java.io.InputStream) => slime.jrunscript.native.java.lang.String } */
			readJavaString: function(_stream) {
				var _reader = new Packages.java.io.InputStreamReader(_stream);
				var _writer = new Packages.java.io.StringWriter();
				var c;
				while( (c = _reader.read()) != -1 ) {
					_writer.write(c);
				}
				_reader.close();
				_writer.close();
				return _writer.toString();
			}
		};

		(function() {
			var jarUrl = function(string) {
				if (string.indexOf("!") != -1) {
					var tokens = string.split("!");
					if (tokens.length == 2) {
						if (new Packages.java.io.File(tokens[0]).exists()) {
							return "jar:file:" + tokens[0] + "!" + "/" + tokens[1];
						}
					}
				}
			}
			//	Given a string, returns either { file: absolute java.io.File } or { url: java.net.URL }
			var interpret = function(string) {
				if (new Packages.java.io.File(string).exists()) {
					//	TODO	study using getCanonicalFile() instead; key would be what getParentFile() of given file returns
					var file = new Packages.java.io.File(string).getAbsoluteFile();
					return {
						file: file
					};
				} else if (jarUrl(string)) {
					return {
						url: new Packages.java.net.URL(jarUrl(string))
					};
				} else {
					try {
						var url = new Packages.java.net.URL(string);
					} catch (e) {
						if (e.javaException) {
							e.javaException.printStackTrace();
						}
						throw new Error("Could not parse: " + string + " $engine.script = " + $engine.script);
					}
					if (String(url.getProtocol()) == "file") {
						return {
							file: new Packages.java.io.File(url.toURI())
						};
					} else {
						return {
							url: url
						};
					}
				}
			};

			/**
			 *
			 * @param { slime.jrunscript.native.java.net.URL } url
			 * @returns { { zipUrl: slime.jrunscript.native.java.net.URL, branch: string, path: string } }
			 */
			var toGithubArchiveLocation = function(url) {
				var string = String(url);
				var githubRawPattern = /http(s?)\:\/\/raw.githubusercontent.com\/davidpcaldwell\/slime\/([^\/]*)\/(.*)$/;
				var githubRawPatternMatch = githubRawPattern.exec(string);
				var githubArchivePattern = /http(s?)\:\/\/github\.com\/davidpcaldwell\/slime\/archive\/refs\/heads\/(.*)\.zip\!(?:[^\/]*)\/(.*)/;
				var githubArchiveMatch = githubArchivePattern.exec(string);
				if (githubRawPatternMatch) {
					//	need to intercede with ZIP file
					var zipurl = new Packages.java.net.URL(
						"http" + githubRawPatternMatch[1] + "://github.com/davidpcaldwell/slime/archive/refs/heads/" + githubRawPatternMatch[2] + ".zip"
					);
					return {
						zipUrl: zipurl,
						//	branch is needed because downloaded .zip files use the branch as part of the zip prefix inside the file
						branch: githubRawPatternMatch[2],
						path: githubRawPatternMatch[3]
					}
				} else if (githubArchiveMatch) {
					var zipUrl = new Packages.java.net.URL(
						"http" + githubArchiveMatch[1] + "://github.com/davidpcaldwell/slime/archive/refs/heads/" + githubArchiveMatch[2] + ".zip"
					);
					var branch = githubArchiveMatch[2];
					var path = githubArchiveMatch[3];
					return {
						zipUrl: zipUrl,
						branch: branch,
						path: path
					};
				} else {
					return null;
				}
			}

			/**
			 * Creates an in-memory object that represents the contents of a GitHub source archive. The given `InputStream` is read
			 * and parsed into its file entries; the directory structure is also captured to provide the ability to list a folder
			 * within an archive.
			 *
			 * @param { slime.jrunscript.native.java.io.InputStream } _stream
			 */
			var GithubArchive = function(_stream) {
				//	This function is pretty much a direct port of inohit.script.engine.Code.Loader.zip into JavaScript

				var files = {};
				var directories = {};

				var maintainDirectories = function(entryName) {
					var hasSlash = entryName.indexOf("/") != -1;
					var endsWithSlash = /\/$/.test(entryName);
					if (hasSlash) {
						var directory;
						var basename;
						if (endsWithSlash) {
							var before = entryName.substring(0, entryName.length-1);
							var split = before.split("/"); ///entryName.substring(0, entryName.length()-1).lastIndexOf("/");
							if (split.length == 1) {
								directory = "";
								basename = entryName;
							} else {
								directory = split.slice(0, split.length-1).join("/") + "/";
								basename = split[split.length-1] + "/";
							}
						} else {
							var tokens = entryName.split("/");
							directory = tokens.slice(0, tokens.length-1).join("/") + "/";
							basename = tokens[tokens.length-1];
						}
						var listing = directories[directory];
						if (!listing) {
							listing = {};
							directories[directory] = listing;
						}
						listing[basename] = true;
						maintainDirectories(directory);
					}
				}

				io.zip.parse(_stream, {
					directory: function(name) {
						maintainDirectories(name);
					},
					write: function(name,_stream) {
						maintainDirectories(name);
						var to = new Packages.java.io.ByteArrayOutputStream();
						io.copy(_stream, to);
						files[name] = to.toByteArray();
					}
				});

				_stream.close();

				return {
					read: function(name) {
						if (!files[name]) return null;
						return new Packages.java.io.ByteArrayInputStream(files[name]);
					},
					list: function(path) {
						var listing = directories[path];
						return (listing) ? Object.keys(listing) : null;
					}
				}
			};

			var githubArchives = (function() {
				var archives = (
					function() {
						/** @type { { [url: string]: slime.internal.jrunscript.bootstrap.github.Archive } } */
						var cache = {};

						/** @type { { [url: string]: slime.jrunscript.native.java.io.File } } */
						var downloaded = {};

						return {
							get: function(_url) {
								var url = String(_url.toExternalForm());
								if (!cache[url]) {
									var property = Packages.java.lang.System.getProperty(
										"slime.bootstrap.githubArchive." + _url.toExternalForm()
									);
									var file;
									if (property) {
										file = new Packages.java.io.File(String(property))
									} else {
										var tmp = Packages.java.io.File.createTempFile("github-archive-", ".zip");
										io.copy(
											new Packages.java.io.BufferedInputStream(_url.openStream()),
											new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(tmp))
										);
										downloaded[url] = tmp;
										file = tmp;
									}
									cache[url] = GithubArchive(new Packages.java.io.FileInputStream(file));
								}
								return cache[url];
							},
							properties: function() {
								throw new Error("Unimplemented.");
							}
						}
					}
				)();

				return {
					getSourceFile: function(_url) {
						var location = toGithubArchiveLocation(_url);
						if (location) {
							$api.debug("Checking archive " + JSON.stringify({ url: String(location.zipUrl), branch: location.branch, path: location.path }));
							var archive = archives.get(location.zipUrl);
							if (archive) {
								$api.debug("Archive found (of course) at " + location);
								var _inputStream = archive.read("slime-" + location.branch + "/" + location.path);
								if (!_inputStream) {
									$api.debug("Not found in " + archive + ": " + "slime-" + location.branch + "/" + location.path);
									return null;
								}
								return io.readJavaString(_inputStream);
							} else {
								return void(0);
							}
						} else {
							$api.debug("No location for " + _url);
							return void(0);
						}
					},
					getSourceFilesUnder: function(_url) {
						var location = toGithubArchiveLocation(_url);
						if (location) {
							var archive = archives.get(location.zipUrl);
							if (archive) {
								$api.debug("Listing URL " + _url + " path " + location.path);
								//	TODO	should not hard-code master
								var list = archive.list("slime-" + location.branch + "/" + location.path);

								var rv = [];
								for (var i=0; i<list.length; i++) {
									rv.push(new Packages.java.net.URL(_url, list[i]));
								}
								return rv;
							} else {
								return null;
							}
						} else {
							return null;
						}
					}
				}
			})();

			$api.github = {
				archives: githubArchives,
				test: {
					toArchiveLocation: function(url) {
						return toGithubArchiveLocation(url);
					},
					zip: function(input) {
						return GithubArchive(input)
					}
				}
			}

			/**
			 *
			 * @param { any } f
			 * @returns { slime.internal.jrunscript.bootstrap.Global["$api"]["Script"] }
			 */
			function withRunProperty(f) {
				return f;
			}

			$api.Script = withRunProperty(
				/** @this { slime.internal.jrunscript.bootstrap.Script } */
				function Script(p) {
					if (p.caller) {
						var caller = $engine.getCallingScript();
						return new Script(interpret(caller));
					}
					if (p.string) {
						return new Script(interpret(p.string));
					}
					if (p.file) {
						this.toString = function() { return String(p.file.getCanonicalPath()); }
						this.file = p.file;
						this.resolve = function(path) {
							var file = (new Packages.java.io.File(path).isAbsolute())
								? new Packages.java.io.File(path)
								: new Packages.java.io.File(p.file.getParentFile(), path)
							;
							if (file.exists()) return new Script({ file: file });
							return null;
						};
					} else if (p.url) {
						this.toString = function() { return String(p.url.toExternalForm()); }
						this.url = p.url;
						this.resolve = function(path) {
							$api.debug("Resolving " + path + " from " + p.url + " ...");
							var url = new Packages.java.net.URL(p.url, path);
							$api.debug("Resolving " + url + " ...");
							var archiveCode = $api.github.archives.getSourceFile(url);
							$api.debug("archiveCode = " + archiveCode);
							if (archiveCode) {
								return new Script({ url: url, code: archiveCode });
							} else if (archiveCode === null) {
								return null;
							}
							var connection;
							try {
								var protocol = String(p.url.getProtocol());
								if (protocol == "http" || protocol == "https") {
									$api.log("Connecting to " + url + " ...");
								}
								connection = url.openConnection();
								// Packages.java.lang.System.err.println("url: " + url + " connection = " + connection);
								if (connection.getResponseCode) {
									if (connection.getResponseCode() == 404) return null;
									if (connection.getResponseCode() == 500) return null;
								} else {
									try {
										var _stream = connection.getInputStream();
									} catch (e) {
										return null;
									}
								}
							} catch (e) {
								Packages.java.lang.System.err.println(e);
								Packages.java.lang.System.err.println("stack: " + e.stack);
								return null;
							}
							return new Script({ url: url, connection: connection });
						};
					} else {
						throw new Error("Undefined script.");
					}

					this.load = function() {
						var was = $api.script;
						$api.script = this;
						if (p.connection) {
							var version = String(Packages.java.lang.System.getProperty("java.version"));
							var points = version.split(".");
							if (points[0] == "1" && Number(points[1]) < 8 || this.toString().substring(0,3) == "jar") {
								//	TODO	this has the downside of loading the code twice; is there a better way? Maybe using eval()?
								//	TODO	is this best method to prevent resource leaks? Should HttpURLConnection.disconnect() be used?
								//			not using it not because it might prevent pipelining
								//	TODO	not clear why the other implementation does not work for JAR files but it is not so important
								//			to conserve JAR accesses as it is to conserve HTTP accesses
								p.connection.getInputStream().close();
								load(this.toString());
							} else {
								var protocol = String(p.url.getProtocol());
								if (protocol == "http" || protocol == "https") {
									$api.log("Reading from " + p.url + " ...");
								}
								$api.debug("opening input stream");
								var _stream = p.connection.getInputStream();
								$api.debug("opened input stream");
								var code = $api.io.readJavaString(_stream);
								if (protocol == "http" || protocol == "https") {
									$api.log("Loaded [" + p.url + "].");
								}
								var name = this.toString();
								load({
									name: name,
									script: code
								});
							}
						} else if (p.code) {
							//	Not a documented form of Rhino load(); see rhino.github.io/tools/shell, but might be valid
							//	Or possibly we invented this. But in any case we use it in embedding.
							//	Quick test from Rhino prompt indicates we probably simply invented this form
							//	Ah, no, *Nashorn* supports this form.
							//	https://docs.oracle.com/javase/8/docs/technotes/guides/scripting/nashorn/shell.html
							load({
								name: this.toString(),
								script: p.code
							})
						} else {
							load(this.toString());
						}
						$api.script = was;
					}
				}
			);

			$api.Script.run = function(p) {
				new $api.Script(p).load();
			}

			$api.Script.test = {
				interpret: interpret
			}

			if (configuration && configuration.script && configuration.script.url) {
				$api.debug("configuration.script.url = " + configuration.script.url);
				$api.script = new $api.Script({
					url: new Packages.java.net.URL(configuration.script.url)
				});
			} else if (configuration && configuration.script && configuration.script.file) {
				$api.debug("configuration.script.file = " + configuration.script.file);
				$api.script = new $api.Script({
					file: new Packages.java.io.File(configuration.script.file)
				});
			// } else if (/18\.slime\!api\.js$/.test($engine.script)) {
			// 	//	TODO	FFS
			// 	//	these IDs do appear stable as long as plugins do not change but this is horrendous and should be reworked,
			// 	//	perhaps by reworking how packaged scripts work
			// 	$api.debug("PACKAGED? engine.script " + $engine.script + " so $api.script null");
			// 	var script = "jar:file:" + $engine.script.split("/").slice(0,-1).join("/") + "/" + "5.slime!/main.js";
			// 	//	Indicates this is embedded API in a built shell.
			// 	//	We could set the below, but it is not apparent it would have an effect
			// 	$api.script = null;
			// 	$api.embed = {
			// 		jsh: new $api.Script({ url: new Packages.java.net.URL(script) })
			// 	};
			// 	if (configuration.arguments.length != 1 || configuration.arguments[0] != "api") {
			// 		throw new Error("Loading api.js from .slime should be done only for embedding API.");
			// 	}
			} else if (/\.slime\!api\.js$/.test($engine.script)) {
				$api.debug("engine.script " + $engine.script + " so $api.script null");
				// var script = "jar:file:" + $engine.script.split("/").slice(0,-1).join("/") + "/" + "jrunscript.jsh.launcher.slime!/main.js";
				//	Indicates this is embedded API in a built shell.
				//	We could set the below, but it is not apparent it would have an effect
				$api.script = null;
				// $api.embed = {
				// 	jsh: new $api.Script({ url: new Packages.java.net.URL(script) })
				// };
				if (configuration.arguments.length != 1 || configuration.arguments[0] != "api") {
					throw new Error("Loading api.js from .slime should be done only for embedding API.");
				}
			} else if (/\.zip\!(.*)\/rhino\/jrunscript\/api\.js$/.test($engine.script)) {
				$api.debug("engine.script .zip! so null");
				//	Indicates this is embedded API in a remote shell.
				$api.script = null;
				if (configuration.arguments.length != 1 || configuration.arguments[0] != "api") {
					throw new Error("Loading api.js from .zip should be done only for embedding API.");
				}
			} else {
				$api.debug("$engine.script = " + $engine.script);
				$api.script = new $api.Script({
					string: $engine.script
				});
				// if ($api.script.url) {
				// 	if (toGithubArchiveLocation($api.script.url)) {
				// 		var zipUrl = toGithubArchiveLocation($api.script.url).zipUrl;
				// 		githubArchives.download(zipUrl);
				// 	}
				// }
			}

			if (configuration && configuration.arguments) {
				$api.arguments = configuration.arguments;
			} else {
				$api.arguments = (function() {
					//	TODO	Use $api.engine.resolve
					if (this["javax.script.argv"]) {
						//	Nashorn, JSR223 Rhino
						return (function(property) {
							var rv = [];
							for (var i=0; i<property.length; i++) {
								if (String(property[i]) == "-classpath") {
									i++;
								} else {
									rv.push(String(property[i]));
								}
							}
							return rv;
						})(this["javax.script.argv"]);
					}
					//	Rhino
					if (this.arguments) return Array.prototype.slice.call(this.arguments);
					//	Rhino embedding
					if (!this["javax.script.argv"]) return [];
				})();
			}
		})();

		$api.java = (
			function() {
				var getMajorVersion = (function() {
					var oneDotPattern = /^1\.(.*)\./;
					var majorVersionPattern = /^(\d+)\./;

					/**
					 * @type { (javaVersionNumber: string) => number }
					 */
					return function(javaVersionNumber) {
						if (oneDotPattern.test(javaVersionNumber)) {
							return Number(oneDotPattern.exec(javaVersionNumber)[1]);
						} else if (majorVersionPattern.test(javaVersionNumber)) {
							return Number(majorVersionPattern.exec(javaVersionNumber)[1])
						}
					};
				})();

				var Install = function(home) {
					var File = Packages.java.io.File;

					/** @type { typeof Packages.javax.tools.ToolProvider["getSystemJavaCompiler"] } */
					var getSystemJavaCompiler = (
						function() {
							var tried = false;

							/** @type { slime.jrunscript.native.javax.tools.JavaCompiler } */
							var compiler;

							return function() {
								if (!tried) {
									compiler = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
									tried = true;
								}
								return compiler;
							}
						}
					)();

					/**
					 * @type { (args: string[]) => void }
					 */
					var compile = function(args) {
						var compiler = getSystemJavaCompiler();
						if (!compiler) throw new Error("No Java compiler available on this platform.");
						var jarray = Packages.java.lang.reflect.Array.newInstance($api.java.getClass("java.lang.String"),args.length);
						for (var i=0; i<jarray.length; i++) {
							jarray[i] = new Packages.java.lang.String(args[i]);
						}
						var SUPPRESS_COMPILATION_OUTPUT = !$api.debug.on;
						$api.debug("Suppress compilation output = " + SUPPRESS_COMPILATION_OUTPUT)
						var NOWHERE = new JavaAdapter(
							Packages.java.io.OutputStream,
							new function() {
								this.write = function(b){}
							}
						);

						var run = function(suppressOutput) {
							return compiler.run(
								Packages.java.lang.System["in"],
								Packages.java.lang.System.out,
								suppressOutput ? new Packages.java.io.PrintStream(NOWHERE) : Packages.java.lang.System.err,
								jarray
							);
						}
						var status = run(SUPPRESS_COMPILATION_OUTPUT);
						if (status) {
							var error = new Error("Compiler exited with status " + status + " with inputs:\n"
								+ "-classpath" + " " + Packages.java.lang.System.getProperty("java.class.path")
								+ " "
								+ args.join(" ")
							);
							run(false);
							Packages.java.lang.System.err.println(String(error));
							Packages.java.lang.System.err.println(error.stack);
							throw error;
						}
					};

					var getMajorVersionForJdkViaJavaDashVersion = function() {
						//	TODO	possibly should consider jrunscript invocation
						//			jrunscript -e print(java.lang.System.getProperty(\"java.version\"))
						var mode = {
							output: "",
							err: ""
						}
						var status = $api.engine.runCommand(
							new File(home, "bin/java"),
							"-version",
							mode
						);
						if (status) throw new Error(
							"Error determining Java version for loader; exit status " + status
							+ " stdout: " + mode.output
							+ " stderr: " + mode.err
						);
						var pattern = /\"(.+)\"/;
						var version;
						var majorVersion;
						mode.err.split("\n").forEach(function(line) {
							var match = pattern.exec(line);
							if (match) version = match[1];
						});
						if (!version) throw new Error("Could not detect Java version.");
						return getMajorVersion(version);
					};

					var rv = {
						toString: function() {
							return "Java home: " + home;
						},
						home: home,
						launcher: (function() {
							if (new File(home, "bin/java").exists()) return new File(home, "bin/java");
							if (new File(home, "bin/java.exe").exists()) return new File(home, "bin/java.exe");
						})(),
						jrunscript: (function() {
							if (new File(home, "bin/jrunscript").exists()) return new File(home, "bin/jrunscript");
							if (new File(home, "bin/jrunscript.exe").exists()) return new File(home, "bin/jrunscript.exe");
							if (new File(home, "../bin/jrunscript").exists()) return new File(home, "../bin/jrunscript");
							if (new File(home, "../bin/jrunscript.exe").exists()) return new File(home, "../bin/jrunscript.exe");
						})(),
						compile: void(0),
						getMajorVersion: getMajorVersionForJdkViaJavaDashVersion
					};

					rv.compile = void(0);

					//	TODO	refactor into making the getter a separate function and reusing it: as getting in if and invoked in else
					if (Object.defineProperty) {
						Object.defineProperty(rv, "compile", {
							get: function() {
								var compiler = getSystemJavaCompiler();
								if (compiler) return compile;
								return void(0);
							}
						});
					} else {
						rv.compile = compile;
					}



					return rv;
				};

				var install = Install(new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home")));
				var getClass = function(name) {
					return $engine.getClass(name);
				}
				var Array = function(p) {
					return $engine.newArray(p.type,p.length);
				}
				var Command = function() {
					var vmArguments = [];
					var properties = {};
					var classpath = [];
					var main;
					var mainArguments = [];

					var launchers = {};
					launchers.Vm = function(home) {
						if (!home) home = $api.java.install;
						return function(mode) {
							if (!mode) mode = {};
							if (!mode.input) mode.input = Packages.java.lang.System["in"];
							$api.debug("Invoking launcher: " + home.launcher);
							var tokens = [home.launcher];
							tokens.push.apply(tokens,vmArguments);
							for (var x in properties) {
								tokens.push("-D" + x + "=" + properties[x]);
							}
							if (!classpath.map) {
								Array.prototype.map = function(f,target) {
									if (!target) target = {};
									var rv = [];
									for (var i=0; i<this.length; i++) {
										rv[i] = f.call(target,this[i],i,this);
									}
									return rv;
								}
							}
							tokens.push(
								"-classpath",
								classpath.map(function(_url) {
									if (String(_url.getProtocol()) == "file") {
										return String(new Packages.java.io.File(_url.toURI()).getCanonicalPath());
									} else {
										throw new Error("Cannot fork VM with remote URL in classpath.");
									}
								}).join(String(Packages.java.io.File.pathSeparator))
							)
							tokens.push(main);
							tokens.push.apply(tokens,mainArguments);
							tokens.push( (mode) ? mode : {} );
							$api.debug("Invoking runCommand");
							return $api.engine.runCommand.apply(null,tokens);
						}
					};
					launchers.ClassLoader = function(mode) {
						$api.debug("Running in ClassLoader ...");
						for (var x in properties) {
							if (properties[x]) {
								Packages.java.lang.System.setProperty(x, properties[x]);
							}
						}
						var ClassLoader = function(elements) {
							var _urls = $api.java.Array({ type: Packages.java.net.URL, length: elements.length });
							for (var i=0; i<elements.length; i++) {
								//_urls[i] = new Packages.java.io.File(elements[i]).toURI().toURL();
								_urls[i] = elements[i];
								//debug("classpath: " + elements[i]);
							}
							var _classloader = new Packages.java.net.URLClassLoader(_urls);
							return _classloader;
						}
						$api.debug("ClassLoader classpath=" + classpath);
						var _classloader = ClassLoader(classpath);
						$api.debug("ClassLoader _classloader=" + _classloader);
						var _main = _classloader.loadClass(main);
						$api.debug("main: " + _main);
						$api.debug("inonit.system.Logging launcher = " + Packages.inonit.system.Logging);
						$api.debug("inonit.system.Logging loaded = " + _classloader.loadClass("inonit.system.Logging"));
						// var _class = _classloader.loadClass(main);
						// var _factory = _class.getMethod("engine",new $api.java.Array({ type: Packages.java.lang.Class, length: 0 }));
						// var _engine = _factory.invoke(null,new $api.java.Array({ type: Packages.java.lang.Object, length: 0 }));

						var loaderArguments = [];
						// if (script && typeof(script.path) != "undefined") {
						// 	loaderArguments.push(script.path);
						// } else if (script && typeof(script) == "string") {
						// 	loaderArguments.push(script);
						// }
						loaderArguments.push.apply(loaderArguments,mainArguments);

						var _arguments = $api.java.Array({ type: Packages.java.lang.String, length: loaderArguments.length });
						for (var i=0; i<loaderArguments.length; i++) {
							_arguments[i] = new Packages.java.lang.String(loaderArguments[i]);
						}

						var _argumentTypes = $api.java.Array({ type: Packages.java.lang.Class, length: 1 });
						var _invokeArguments = $api.java.Array({ type: Packages.java.lang.Object, length: 1 });
						_invokeArguments[0] = _arguments;
						_argumentTypes[0] = _arguments.getClass();
						var _method = _main.getMethod("main",_argumentTypes);
						$api.debug("Invoking " + _method + " ...");
						try {
							_method.invoke(null,_invokeArguments);
							$api.debug("Returned.");
							return void(0);
						} catch (e) {
							$api.debug("Returned with error.");
							return 1;
						}
					}

					var launcher = launchers.ClassLoader;

					this.toString = function() {
						var p = "{";
						for (var x in properties) {
							if (p.length > 1) {
								p += ", ";
							}
							p += x;
							p += " : ";
							p += properties[x];
						}
						p += "}";
						return [
							"JavaCommand"
							//	TODO	below used to use JSON.stringify(properties) but did not work on 1.7
							,"properties=" + p
							,"classpath=" + classpath.join(",")
							,"main=" + main
							,"arguments=" + mainArguments.join(",")
						].join(" ");
					}

					this.fork = function() {
						if (launcher == launchers.ClassLoader) {
							$api.debug("Running in VM because of fork() ...");
							launcher = launchers.Vm();
						}
					}

					this.home = function(home) {
						$api.debug("Running in VM because of home() ...");
						launcher = launchers.Vm(home);
					}

					this.vm = function(argument) {
						if (launcher == launchers.ClassLoader) {
							$api.debug("Running in VM because of VM argument " + argument + " ...");
							launcher = launchers.Vm();
						}
						vmArguments.push(argument);
					}

					this.systemProperty = function(name,value) {
						if (typeof(value) != "undefined") {
							properties[name] = value;
						}
					}

					this.classpath = function(element) {
						classpath.push(element);
					}

					this.main = function(className) {
						main = className;
					}

					this.argument = function() {
						mainArguments.push(arguments[0]);
					}

					this.run = function(mode) {
						$api.debug("Running");
						if (mode && launcher == launchers.ClassLoader) {
							$api.debug("Running in VM because of run(mode) ...");
							launcher = launchers.Vm();
						}
						$api.debug("running in launcher = " + launcher);
						return launcher(mode);
					}
				}

				/** @type { slime.internal.jrunscript.bootstrap.Api<{}>["java"]["versions"] } */
				var versions = {
					getMajorVersion: {
						forJavaVersionProperty: getMajorVersion
					}
				};

				return {
					Install: Install,
					install: install,
					getClass: getClass,
					Array: Array,
					Command: Command,
					versions: versions,
					getMajorVersion: function() {
						return getMajorVersion(String(Packages.java.lang.System.getProperty("java.version")));
					}
				}
			}
		)();

		$api.io = {
			copy: io.copy,
			tmpdir: void(0),
			unzip: void(0),
			readJavaString: void(0)
		};
		$api.io.tmpdir = function(p) {
			if (!p) p = {};
			var rv = Packages.java.io.File.createTempFile(
				(p.prefix) ? p.prefix : "jrunscript.",
				(p.suffix) ? p.suffix : ".tmp"
			);
			rv["delete"]();
			rv.mkdirs();
			return rv;
		}
		$api.io.unzip = function(p) {
			var _stream = (function() {
				if (p.from.url) {
					return new Packages.java.net.URL(p.from.url).openConnection().getInputStream();
				}
			})();
			/** @type { slime.internal.jrunscript.bootstrap.internal.io.zip.Processor } */
			var destination = (function() {
				if (p.to._directory) {
					if (p.to._directory.exists()) throw new Error("Cannot unzip to " + p.to._directory + "; already exists.");
					//	TODO	currently creates recursively regardless
					p.to._directory.mkdirs();
				}
				return new function() {
					this.write = function(path,data) {
						var to = new Packages.java.io.File(p.to._directory, path);
						to.getParentFile().mkdirs();
						var out = new Packages.java.io.FileOutputStream(to);
						$api.io.copy(data,out);
					}

					this.directory = function(path) {
						new Packages.java.io.File(p.to._directory, path).mkdirs();
					}
				}
			})();
			io.zip.parse(_stream, destination);
		};
		$api.io.readJavaString = io.readJavaString;

		$api.rhino = (
			function() {
				return {
					version: function(jdkVersion) {
						if (jdkVersion < 11) return "1.7.15";
						return "1.8.0";
					}
				}
			}
		)();

		$api.nashorn = (
			function() {
				/** @notdry nashorn-dependencies reference */
				var mavenDependencies = ["asm","asm-commons","asm-tree","asm-util"].map(function(name) {
					return {
						group: "org.ow2.asm",
						artifact: name,
						version: "7.3.1"
					}
				});

				return {
					dependencies: {
						maven: mavenDependencies,
						names: mavenDependencies.map(function(dependency) { return dependency.artifact; }),
						jarNames: mavenDependencies.map(function(dependency) { return dependency.artifact + ".jar"; })
					},
					getDeprecationArguments: function(javaMajorVersion) {
						if (javaMajorVersion > 8 && javaMajorVersion < 15) {
							return ["-Dnashorn.args=--no-deprecation-warning"];
						}

						return [];
					}
				};
			}
		)();

		$api.shell = {
			environment: void(0),
			HOME: void(0),
			exec: void(0)
		};
		$api.shell.environment = (function() {
			var rv = {};
			var _map = Packages.java.lang.System.getenv();
			var _names = _map.keySet().iterator();
			while(_names.hasNext()) {
				var _name = _names.next();
				var _value = Packages.java.lang.System.getenv(_name);
				rv[String(_name)] = String(_value);
			}
			return rv;
		})();
		$api.shell.HOME = new Packages.java.io.File(Packages.java.lang.System.getProperty("user.home"));
		$api.shell.exec = function(p) {
			//	The jrunscript built-in exec() does not return an exit code (despite the documentation claiming it does), and does not allow
			//	manipulation of the environment or stdio streams
			//	command
			//	arguments
			//	directory
			//	stdio
			var stdio = (function(specified) {
				var rv = {};
				if (!specified) specified = {};
				rv.output = specified.output;
				rv.error = specified.error;
				if (!rv.output) {
					rv.output = Packages.java.lang.System.out;
				}
				if (!rv.error) {
					rv.error = Packages.java.lang.System.err;
				}
				if (rv.output == String) {
					rv.output = new Packages.java.io.ByteArrayOutputStream();
				}
				if (rv.error == String) {
					rv.error = new Packages.java.io.ByteArrayOutputStream();
				}
				return rv;
			})(p.stdio);

			var tokens = [];
			tokens.push(p.command);
			for (var i=0; i<p.arguments.length; i++) {
				tokens.push(p.arguments[i]);
			}
			//	TODO	create $api.java.Array
			var _command = Packages.java.lang.reflect.Array.newInstance($api.java.getClass("java.lang.String"),tokens.length);
			for (var i=0; i<tokens.length; i++) {
				_command[i] = tokens[i];
			}
			var _builder = new Packages.java.lang.ProcessBuilder(_command);
			var USE_JAVA_1_7 = false;
			if (USE_JAVA_1_7) {
				var Redirect = Packages.java.lang.ProcessBuilder.Redirect;
				_builder.redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT);
			}
			if (p.directory) _builder.directory(p.directory);

			var result = {};

			var _process = _builder.start();

			if (!USE_JAVA_1_7) {
				var spool = function(from,to) {
					var t = new Packages.java.lang.Thread(function() {
						var b;
						while( (b = from.read()) != -1 ) {
							to.write(b);
						}
						from.close();
						to.close();
					});
					t.start();
					return t;
				};

				var out = spool(_process.getInputStream(), stdio.output);
				var err = spool(_process.getErrorStream(), stdio.error);
			}

			//	TODO	error handling
			result.status = _process.waitFor();
			out.join();
			err.join();
			["output","error"].forEach(function(stream) {
				if (p.stdio[stream] == String) {
					if (!result.stdio) result.stdio = {};
					stdio[stream].flush();
					result.stdio[stream] = new Packages.java.lang.String(stdio[stream].toByteArray());
				}
			});
			return result;
		}

		this.$api = $api;
	}
//@ts-ignore
).call(this);

(
	/**
	 * @this { slime.internal.jrunscript.bootstrap.Global<{},{}> }
	 */
	function() {
		var Packages = this.Packages;
		var $api = this.$api;

		/**
		 * The script's "query string," which has different meanings based on how the script is invoked.
		 *
		 * * If it is invoked by URL, the actual query string, excluding the `?`.
		 * * If it is invoked with arguments, and the first argument starts with `?`, that argument, excluding the `?`
		 * * If it is invoked with arguments, and the first argument is `jsh`, `jsh`.
		 * * If it is invoked with arguments, and the first argument is `api`, `api`.
		 */
		var $query = (function() {
			//	The only way we presently don't have a script is in the embedding-in-built-shell scenario
			if (!$api.script) {
				return $api.arguments.shift();
			}

			if ($api.script.url && $api.script.url.getQuery()) {
				return String($api.script.url.getQuery());
			}
			if ($api.script.file && $api.arguments[0] && $api.arguments[0].substring(0,1) == "?") {
				return $api.arguments.shift().substring(1);
			}
			if ($api.script.file && $api.arguments[0] && $api.arguments[0] == "jsh") {
				return $api.arguments.shift();
			}
			if ($api.script.file && $api.arguments[0] && $api.arguments[0] == "api") {
				return $api.arguments.shift();
			}
		})();

		if ($query) {
			var parameters = (function() {
				//	Only allows single value for each name; surely sufficient for this purpose
				var rv = {};
				var pairs = $query.split("&");
				for (var i=0; i<pairs.length; i++) {
					var pair = pairs[i];
					var tokens = pair.split("=");
					rv[tokens[0]] = tokens[1];
				}
				return rv;
			})();
			if ($query == "api") {
				if ($api.embed && $api.embed.jsh) {
					//	already set; do nothing
				} else if (!$api.script) {
					//	TODO	#1961 Embedding in built shell
					$api.debug("$api.script null; likely embedding in built shell ...");
					$api.embed = {};
				} else if ($api.script.resolve("main.js")) {
					//	built shell
					$api.embed = {
						jsh: $api.script.resolve("main.js")
					};
				} else {
					$api.embed = {
						jsh: $api.script.resolve("../../jrunscript/jsh/launcher/main.js")
					};
				}
			} else if ($query == "jsh") {
				$api.script.resolve("../../jrunscript/jsh/launcher/main.js").load();
			} else if ($query == "jsh/install") {
				Packages.java.lang.System.err.println("Installing jsh from SLIME source code at " + $api.script.resolve("../../").toString());
				$api.arguments.unshift($api.script.resolve("../../jrunscript/jsh/etc/build.jsh.js").toString());
				$api.script.resolve("../../jsh/launcher/main.js").load();
			} else if (parameters.relative) {
				$api.script.resolve(parameters.relative).load();
			} else if (parameters.test) {
				if (parameters.test == "filename") {
					Packages.java.lang.System.out.println("stack = " + new Packages.java.lang.Throwable().getStackTrace()[0].getFileName());
					var global = (function() { return this; })();
					Packages.java.lang.System.out.println("javax.script.filename = " + global[String(Packages.javax.script.ScriptEngine.FILENAME)]);
				}
			} else {
				Packages.java.lang.System.err.println("Usage: api.js <script> [arguments]");
				Packages.java.lang.System.exit(1);
			}
		} else if (Packages.java.lang.System.getProperty("inonit.jrunscript.api.main")) {
			//	TODO	only used by inonit.script.jsh.launcher.Main; can it be refactored out? Or possibly that entire class can be
			//			factored out?
			$api.Script.run({ string: String(Packages.java.lang.System.getProperty("inonit.jrunscript.api.main")) });
		} else if ($api.script.resolve("main.js")) {
			//	In a built jsh shell, this file is jsh.js, and the jsh launcher is main.js; similarly, a different build process could
			//	provide an arbitrary file to run
			$api.script.resolve("main.js").load();
		} else if ($api.arguments.length) {
			$api.Script.run({ string: $api.arguments.shift() });
		} else {
			$api.embed = {};
		}
		if (!$api.embed) {
			$api.debug("Waiting for threads to terminate.");
			(function preventJrunscriptTermination() {
				//	See https://stackoverflow.com/questions/50958644/threading-in-jrunscript-vs-jjs
				var more = true;
				while(more) {
					var _set = Packages.java.lang.Thread.getAllStackTraces().keySet();
					var _i = _set.iterator();
					var count = 0;
					while(_i.hasNext()) {
						var _thread = _i.next();
						var _stack = _thread.getStackTrace();
						if (!_thread.isDaemon()) {
							count++;
							if (false) $api.debug(_thread);
							for (var i=0; i<_stack.length; i++) {
								if (false) $api.debug(_stack[i]);
							}
							if (false) $api.debug("");
						}
					}
					if (count == 1) {
						more = false;
					} else {
						Packages.java.lang.Thread.sleep(100);
					}
				}
			})()
		} else {
			$api.debug("Embedded.");
		}
	}
//@ts-ignore
).call(this);
