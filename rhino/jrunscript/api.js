//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Exported to script:
//	$api:
//		arguments: array of string containing arguments passed to the script

//	Development:
//	Run tests with jrunscript api.js test/suite.js
//
//	TODO	this script can only be run with JDK Rhino and Nashorn; allow Mozilla Rhino

(function() {
	var $script = (this.$api && this.$api.script) ? this.$api.script : null;
	var $arguments = (this.$api && this.$api.arguments) ? this.$api.arguments : null;
	var $api = {};

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

		var JdkRhino = function() {
			this.toString = function() {
				return "JSR-223 Rhino";
			}
		}

		var engines = {
			nashorn: new Nashorn(),
			rhino: new Rhino(),
			jdkrhino: new JdkRhino()
		};

		var name = (function() {
			if (typeof(Packages.org.mozilla.javascript.Context.getCurrentContext) == "function" && Packages.org.mozilla.javascript.Context.getCurrentContext()) {
				//	TODO	untested
				return "rhino";
			} else if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
				return "nashorn";
			} else {
				return "jdkrhino";
			}
		})();

		var rv = engines[name];
		rv.resolve = function(options) {
			return options[name];
		};
		rv.script = rv.resolve({
			nashorn: function() {
				return new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
			},
			rhino: function() {
				var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));
				var trace = String(new Packages.org.mozilla.javascript.WrappedException(new Packages.java.lang.RuntimeException()).getScriptStackTrace()).split(LINE_SEPARATOR);
				for (var i=0; i<trace.length; i++) {
					if (trace[i].length) {
						var parsed = /^(?:\s+)(?:at )(.*)\:(\d+)$/.exec(trace[i]);
						if (!parsed) {
							throw new Error("Stack trace frame does not match: [" + trace[i] + "]");
						}
						if (/* /api\.js$/.test(parsed[1]) */ true) {
							return parsed[1];
//							return String(new Packages.java.io.File(parsed[1]).getCanonicalPath());
						}
					}
				}
				return null;
			},
			jdkrhino: function() {
				return global[String(Packages.javax.script.ScriptEngine.FILENAME)];
			}
		})();
		rv.newArray = function(type,length) {
			var argument = this.resolve({
				nashorn: function() {
					return type.class;
				},
				rhino: function() {
					return type;
				},
				jdkrhino: function() {
					return type;
				}
			})();
			return Packages.java.lang.reflect.Array.newInstance(argument,length);
		}
		rv.getClass = function(name) {
			//	TODO	does not detect whether this evaluates to JavaPackage
			var jclass = eval("Packages." + name);
			return this.resolve({
				nashorn: function() {
					return jclass.class;
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
			},
			jdkrhino: function() {

			},
			rhino: function() {
				rv.classpath = new Packages.java.io.File(Packages.java.lang.Class.forName("org.mozilla.javascript.Context").getProtectionDomain().getCodeSource().getLocation().toURI());

				this.echo = function(s) {
					print(s);
				}
			}
		})();
		return rv;
	})(this);

	$api.engine = new function() {
		this.toString = function() {
			return $engine.toString();
		}

		this.resolve = function(p) {
			return $engine.resolve(p);
		}
	};

	$api.engine.readFile = (this.readFile) ? this.readFile : function(path) {
		var rv = "";
		var reader = new Packages.java.io.FileReader(path);
		var c;
		while((c = reader.read()) != -1) {
			var _character = new Packages.java.lang.Character(c);
			rv += _character.toString();
		}
		return rv;
	};

	$api.engine.readUrl = (this.readUrl) ? this.readUrl : function(path) {
		var rv = "";
		var connection = new Packages.java.net.URL(path).openConnection();
		var reader = new Packages.java.io.InputStreamReader(connection.getInputStream());
		var c;
		while((c = reader.read()) != -1) {
			var _character = new Packages.java.lang.Character(c);
			rv += _character.toString();
		}
		return rv;
	};

	//	TODO	much of this is redundant with inonit.system.Command, but we preserve it here because we are trying to remain
	//			dependent only on Rhino, which apparently has a bug(?) making its own runCommand() not work correctly in this
	//			scenario when an InputStream is provided: even when underlying process terminates, command does not return
	//	TODO	this has the potential to run really slowly when written in JavaScript
	$api.engine.runCommand = function() {
//		Packages.java.lang.System.err.println("Running a command ...");
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
		Spooler.start = function(_in,_out,closeOnEnd,flush,name) {
			var s = new Spooler(_in, _out, closeOnEnd,flush);
			var t = new Packages.java.lang.Thread(
				new JavaAdapter(
					Packages.java.lang.Runnable,
					s
				)
			);
			t.setName(t.getName() + ":" + name);
			t.start();
			return t;
		};
		var spoolName = Array.prototype.join.call(arguments, ",");
//		Packages.java.lang.System.err.println("Forking a command ... " + Array.prototype.slice.call(arguments).join(" "));
		var delegate = _builder.start();
		var hasConsole = Packages.java.lang.System.console();
		var _in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, !hasConsole, "stdout: " + spoolName);
		var _err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, !hasConsole, "stderr: " + spoolName);
		var _stdin = context.getStandardInput();
		var _out = Spooler.start(_stdin, delegate.getOutputStream(), true, true, "stdin from " + _stdin + ": " + spoolName);
		var rv = delegate.waitFor();
		_in.join();
		_err.join();
		context.finish();
		return rv;
	};

	(function() {
		var interpret = function(string) {
			if (new Packages.java.io.File(string).exists()) {
				//	TODO	study using getCanonicalFile() instead; key would be what getParentFile() of given file returns
				var file = new Packages.java.io.File(string).getAbsoluteFile();
				return {
					file: file
				};
			} else {
				try {
//					if (string.getClass) {
//						throw new Error("it is Java");
//					}
//					string = (function fix(before) {
//						var rv = "";
//						for (var i=0; i<before.length; i++) {
//							if (before.substring(i,i+1) == "\\") {
//								rv += "/";
//							} else {
//								rv += before.substring(i,i+1);
//							}
//						}
//						return rv;
//					})(string);
//					string = string.replace(/\\/g, "/");
					var url = new Packages.java.net.URL(string);
				} catch (e) {
					throw new Error("Could not parse: " + string);
					if (e.javaException) {
						e.javaException.printStackTrace();
					}
					throw e;
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

		$api.Script = function(p) {
			var Callee = arguments.callee;
			if (p.string) {
				return new arguments.callee(interpret(p.string));
			}
			if (p.file) {
				this.toString = function() { return String(p.file.getCanonicalPath()); }
				this.file = p.file;
				this.resolve = function(path) {
					var file = (new Packages.java.io.File(path).isAbsolute())
						? new Packages.java.io.File(path)
						: new Packages.java.io.File(p.file.getParentFile(), path)
					;
					if (file.exists()) return new Callee({ file: file });
					return null;
				};
			} else if (p.url) {
				this.toString = function() { return String(p.url.toExternalForm()); }
				this.url = p.url;
				this.resolve = function(path) {
					var url = new Packages.java.net.URL(p.url, path);
					try {
						var connection = url.openConnection();
						if (connection.getResponseCode) {
							if (connection.getResponseCode() == 404) return null;
							if (connection.getResponseCode() == 500) return null;
						}
					} catch (e) {
						return null;
					}
					return new Callee({ url: new Packages.java.net.URL(p.url, path) });
				};
			} else {
				throw new Error("Undefined script.");
			}

			this.load = function() {
				var was = $api.script;
				$api.script = this;
				load(this.toString());
				$api.script = was;
			}
		};

		$api.Script.run = function(p) {
			new $api.Script(p).load();
		}

		if ($script && $script.url) {
			$api.script = new $api.Script({
				url: new Packages.java.net.URL($script.url)
			});
		} else {
			$api.script = new $api.Script({
				string: $engine.script
			});
		}

		if ($arguments) {
			$api.arguments = $arguments;
		} else {
			$api.arguments = (function() {
				if (this["javax.script.argv"]) {
					//	Nashorn, JSR223 Rhino
					return (function(property) {
						var rv = [];
						for (var i=0; i<property.length; i++) {
							rv[i] = String(property[i]);
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

	$api.java = {};
	$api.java.Install = function(home) {
		var File = Packages.java.io.File;

		this.toString = function() {
			return "Java home: " + home;
		}

		this.home = home;
		this.launcher = (function() {
			if (new File(home, "bin/java").exists()) return new File(home, "bin/java");
			if (new File(home, "bin/java.exe").exists()) return new File(home, "bin/java.exe");
		})();
		this.jrunscript = (function() {
			if (new File(home, "bin/jrunscript").exists()) return new File(home, "bin/jrunscript");
			if (new File(home, "bin/jrunscript.exe").exists()) return new File(home, "bin/jrunscript.exe");
			if (new File(home, "../bin/jrunscript").exists()) return new File(home, "../bin/jrunscript");
			if (new File(home, "../bin/jrunscript.exe").exists()) return new File(home, "../bin/jrunscript.exe");
		})();
	};

	$api.java.install = new $api.java.Install(new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home")));
	(function() {
		var tried = false;
		var compiler;

		Object.defineProperty($api.java.install, "compile", {
			get: function() {
				if (!tried) {
					compiler = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
					tried = true;
				}
				if (compiler) {
					return function(args) {
						var jarray = Packages.java.lang.reflect.Array.newInstance($api.java.getClass("java.lang.String"),args.length);
						for (var i=0; i<jarray.length; i++) {
							jarray[i] = new Packages.java.lang.String(args[i]);
						}
						var status = compiler.run(
							Packages.java.lang.System["in"],
							Packages.java.lang.System.out,
							Packages.java.lang.System.err,
							jarray
						);
						if (status) {
							throw new Error("Compiler exited with status " + status + " with inputs " + args.join(","));
						}
					}
				}
			}
		});
	})();
	$api.java.getClass = function(name) {
		return $engine.getClass(name);
	}
	$api.java.Array = function(p) {
		return $engine.newArray(p.type,p.length);
	}
	$api.java.Command = function() {
		var vmArguments = [];
		var properties = {};
		var classpath = [];
		var main;
		var mainArguments = [];

		var launchers = {};
		launchers.Vm = function(home) {
			if (!home) home = $api.java.install;
			return function(mode) {
				var tokens = [home.launcher];
				tokens.push.apply(tokens,vmArguments);
				for (var x in properties) {
					tokens.push("-D" + x + "=" + properties[x]);
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
				return $api.engine.runCommand.apply(null,tokens);
			}
		};
		launchers.ClassLoader = function(mode) {
			for (var x in properties) {
				if (properties[x]) {
					Packages.java.lang.System.setProperty(x, properties[x]);
				}
			}
			var ClassLoader = function(elements) {
				var _urls = new $api.java.Array({ type: Packages.java.net.URL, length: elements.length });
				for (var i=0; i<elements.length; i++) {
					_urls[i] = new Packages.java.io.File(elements[i]).toURI().toURL();
					//debug("classpath: " + elements[i]);
				}
				var _classloader = new Packages.java.net.URLClassLoader(_urls);
				return _classloader;
			}
			var _classloader = new ClassLoader(classpath);
			var _main = _classloader.loadClass(main);
//			var _class = _classloader.loadClass(main);
//			var _factory = _class.getMethod("engine",new $api.java.Array({ type: Packages.java.lang.Class, length: 0 }));
//			var _engine = _factory.invoke(null,new $api.java.Array({ type: Packages.java.lang.Object, length: 0 }));

			var loaderArguments = [];
//			if (script && typeof(script.path) != "undefined") {
//				loaderArguments.push(script.path);
//			} else if (script && typeof(script) == "string") {
//				loaderArguments.push(script);
//			}
			loaderArguments.push.apply(loaderArguments,mainArguments);

			var _arguments = new $api.java.Array({ type: Packages.java.lang.String, length: loaderArguments.length });
			for (var i=0; i<loaderArguments.length; i++) {
				_arguments[i] = new Packages.java.lang.String(loaderArguments[i]);
			}

			var _argumentTypes = new $api.java.Array({ type: Packages.java.lang.Class, length: 1 });
			var _invokeArguments = new $api.java.Array({ type: Packages.java.lang.Object, length: 1 });
			_invokeArguments[0] = _arguments;
			_argumentTypes[0] = _arguments.getClass();
			var _method = _main.getMethod("main",_argumentTypes);
			try {
				_method.invoke(null,_invokeArguments);
				return 0;
			} catch (e) {
				return 1;
			}
		}

		var launcher = launchers.ClassLoader;

		this.toString = function() {
			return [
				"JavaCommand",
				"properties=" + JSON.stringify(properties),
				"classpath=" + classpath.join(","),
				"main=" + main,
				"arguments=" + mainArguments.join(",")
			].join(" ");
		}

		this.home = function(home) {
			launcher = new launchers.Vm(home);
		}

		this.vm = function(argument) {
			if (launcher == launchers.ClassLoader) {
				launcher = new launchers.Vm();
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

		this.fork = function() {
			launcher = new launchers.Vm();
		}

		this.run = function(mode) {
			if (mode && launcher == launchers.ClassLoader) {
				launcher = new launchers.Vm();
			}
			return launcher(mode);
		}
	}
	$api.io = {};
	$api.io.copy = function(from,to) {
		var b;
		while( (b = from.read()) != -1 ) {
			to.write(b);
		}
		to.close();
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
		var _zipstream = new Packages.java.util.zip.ZipInputStream(_stream);
		var _entry;
		while(_entry = _zipstream.getNextEntry()) {
			if (_entry.getName().endsWith(new Packages.java.lang.String("/"))) {
				destination.directory(String(_entry.getName()));
			} else {
				var name = String(_entry.getName());
				destination.write(name,_zipstream);
			}
		}
		_stream.close();
	};
	$api.bitbucket = {};
	$api.bitbucket.get = function(p) {
		var owner = (p.owner) ? p.owner : "davidpcaldwell";
		var repository = (p.repository) ? p.repository : "slime";
		var revision = (p.revision) ? p.revision : "tip";
		var protocol = (p.protocol) ? p.protocol : "https";
		var URL = protocol + "://bitbucket.org/" + owner + "/" + repository + "/" + "get" + "/" + revision + ".zip";
		var tmp = $api.io.tmpdir();
		tmp["delete"]();
		$api.io.unzip({
			from: { url: URL },
			to: { _directory: tmp }
		});
		var root = tmp.listFiles()[0];
		if (p.destination) {
			root.renameTo(p.destination);
			if (p.revision) {
				var writer = new Packages.java.io.FileWriter(new Packages.java.io.File(p.destination, ".version"));
				writer.write(p.revision);
				writer.close();
			}
		} else {
			return root;
		}
	}
	$api.bitbucket.script = function(p) {
		//	TODO	should default be '@'?
		var owner = (p.owner) ? p.owner : "davidpcaldwell";
		var repository = p.repository;
		var revision = (p.revision) ? p.revision : "tip";
		var URL = p.protocol + "://bitbucket.org/api/1.0/repositories/" + owner + "/" + repository + "/" + "raw" + "/" + revision + "/" + p.script;
		$api.Script.run({ string: URL });
	}
	$api.rhino = {};
	$api.rhino.classpath = $engine.resolve({
		jdkrhino: null,
		nashorn: null,
		rhino: $engine.classpath
	});
	$api.rhino.download = function(version) {
		if (!version) version = "mozilla/1.7R3";
		var sources = {
			"mozilla/1.7R3": {
				url: "http://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip",
				format: "dist"
			}
		};
		var source = sources[version];
		if (!source) throw new Error("No known way to retrieve Rhino version " + version);
		if (source.format == "dist") {
			var _url = new Packages.java.net.URL(source.url);
			println("Downloading Rhino from " + _url);
			var _connection = _url.openConnection();
			var _zipstream = new Packages.java.util.zip.ZipInputStream(_connection.getInputStream());
			var _entry;
			var tmpdir = Packages.java.io.File.createTempFile("jsh-install",null);
			tmpdir["delete"]();
			tmpdir.mkdirs();
			if (!tmpdir.exists()) {
				throw new Error("Failed to create temporary file.");
			}
			var tmprhino = new Packages.java.io.File(tmpdir,"js.jar");
			while(_entry = _zipstream.getNextEntry()) {
				var name = String(_entry.getName());
				var path = name.split("/");
				if (path[1] == "js.jar") {
					var out = new Packages.java.io.FileOutputStream(tmprhino);
					$api.io.copy(_zipstream,out);
				}
			}
			println("Downloaded Rhino to " + tmprhino);
			return tmprhino;
		} else {
			throw new Error("Unsupported Rhino format: version=" + version + " format=" + source.format);
		}
	}

	$api.shell = {};
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
	$api.shell.rhino = function(p) {
		//	p:
		//		rhino (Packages.java.io.File): Rhino js.jar
		//		script (Packages.java.io.File): main script to run
		//		arguments (Array): arguments to send to script
		//		directory (optional Packages.java.io.File): working directory in which to run it
		//		properties: (Object): keys are keys, values are values
		var dashD = [];
		if (p.properties) {
			for (var x in p.properties) {
				dashD.push("-D" + x + "=" + p.properties[x]);
			}
		}
		var args = [
		]
		.concat(dashD)
		.concat([
			"-jar",p.rhino.getCanonicalPath(),
			"-opt","-1",
			p.script.getCanonicalPath()
		]).concat((p.arguments) ? p.arguments : []);
		$api.shell.exec({
			command: $api.java.install.launcher.getCanonicalPath(),
			arguments: args,
			directory: p.directory
		});
	};

	this.$api = $api;
}).call(this);

(function() {
	var $api = this.$api;
	if (Packages.java.lang.System.getProperty("inonit.jrunscript.api.passive")) {
		return;
	}
	var $query = (function() {
		if ($api.script.url && $api.script.url.getQuery()) {
			return String($api.script.url.getQuery());
		}
		if ($api.script.file && $api.arguments[0] && $api.arguments[0].substring(0,1) == "?") {
			return $api.arguments.shift().substring(1);
		}
		if ($api.script.file && $api.arguments[0] && $api.arguments[0] == "jsh") {
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
		if ($query == "jsh") {
			$api.script.resolve("../../jsh/launcher/main.js").load();
		} else if (parameters.relative) {
			$api.script.resolve(parameters.relative).load();
		} else if (parameters.bitbucket) {
			var parser = /(?:(\w+)\/)?(\w+)(?:\@(\w+))?\:(.*)/;
			var parsed = parser.exec(parameters.bitbucket);
			var get = {
				owner: parsed[1],
				repository: parsed[2],
				revision: parsed[3]
			};
			if (false) {
				var tmp = $api.bitbucket.get(get);
				$api.Script.run({ file: new Packages.java.io.File(tmp,parsed[4]) });
			} else {
				//	Packages.java.lang.System.err.println("protocol = " + $api.script.url.getProtocol());
				get.script = parsed[4];
				//	We pass protocol because mock Bitbucket uses http while Bitbucket uses https
				get.protocol = String($api.script.url.getProtocol());
				$api.bitbucket.script(get);
			}
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
		$api.Script.run({ string: String(Packages.java.lang.System.getProperty("inonit.jrunscript.api.main")) });
	} else if ($api.script.resolve("main.js")) {
		$api.script.resolve("main.js").load();
	} else if ($api.arguments.length) {
		$api.Script.run({ string: $api.arguments.shift() });
	} else {
		//	if there are no arguments, we will settle for putting $api in the scope
	}
}).call(this);