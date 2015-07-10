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

//	TODO	rename this file to jsh.launcher.js

//	NOTES ABOUT UNSUPPORTED PLATFORMS
//	=================================
//
//	OLDER JAVA
//
//	To backport to 1.4 or lower, some mechanism would be needed to enumerate the environment variables. At one time this was done
//	with usr/bin/env on UNIX and was not done at all on Windows (except Cygwin; see below).
//
//	OLDER RHINO
//
//	Old versions of Rhino used Apache XMLBeans to implement E4X. If $JSH_HOME/lib/xbean.jar is present, could add it and
//	$JSH_HOME/lib/jsr173_1.0_api.jar to the "Rhino classpath" along with Rhino proper.
//
//	CYGWIN
//
//	Cygwin was once a supported platform, but it is unsupported for now. These comments pertain to the previous Cygwin
//	implementation to assist if it is resurrected.
//
//	*	Obviously many settings that are file paths need to be converted from, or to, Cygwin format, or to Cygwin format, and a
//		design would need to be developed for that purpose
//	*	Packaged applications for Cygwin may have the Cygwin paths helper at $jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe,
//		and may need to create a Cygwin library directory, copy the executable to that directory, and specify that directory to
//		the shell as some kind of property (at one time known as JSH_LIBRARY_NATIVE).
//	*	Non-packaged applications probably need to specify the equivalent of JSH_LIBRARY_NATIVE as well, to get the Cygwin paths
//		helper.
//	*	Cygwin shells probably should use Cygwin /tmp as the default temporary directory (if jsh.shell.tmpdir is not specified)
//	*	Cygwin shells probably should accept the script argument in Cygwin format
//	*	If directives continue to be supported, CLASSPATH directives should probably be accepted in Cygwin format
//	*	If Cygwin is present, should send its root directory as cygwin.root system property
//	*	If Cygwin is present and native library directory is present, send the inonit.script.runtime.io.cygwin.cygpath.exe full
//		path as cygwin.paths property. Otherwise, check to see if the Cygwin file system implementation emits a warning without the
//		cygwin.paths property; if it does not, possibly add one here.

//	NOTES ABOUT REMOVED FEATURES
//	============================
//
//	DIRECTIVES
//
//	At one time, a script could use "directives," which used lines beginning with '#' or '//#' to specify certain kinds of startup
//	configuration:
//		*	//#CLASSPATH </dir1:/dir2> added /dir1 and /dir2 to the script classpath
//		*	//#JVM_OPTION added an option to be used when starting the Java VM.
//		*	//#JDK_LIBRARY added a JDK library to the classpath (usually tools.jar).
//
//	This feature was removed for several reasons:
//		*	It was never tested with CoffeeScript and would have complicated the implementation of CoffeeScript or similar
//			preprocessors
//		*	There are easier, more robust ways to do each of these things:
//			*	For CLASSPATH, there is now jsh.loader.java.add()
//			*	For	JDK_LIBRARY, one can use a combination of jsh.shell.java.home and jsh.loader.java.add
//				TODO	better way to locate JDK libraries, perhaps with jsh.shell property
//			*	For JVM_OPTION, or others if they really need to be loaded at startup, one can simply have the script re-launch
//				itself as a subprocess using the desired configuration via jsh.shell.run, jsh.shell.java, or jsh.shell.jsh.
//
//	PATH SEARCHING
//
//	If a local, non-absolute path to a script was given, and did not resolve to a specific script relative to the working directory,
//	the shell used to search the PATH environment variable for scripts at the given relative path to execute. This feature does not
//	seem to have been useful, and scripts intended to be used as "commands" would typically be wrapped in bash scripts, which do
//	have the PATH semantics.
//
//	SHELL CLASSPATH
//
//	At one time, it was possible to configure the "shell classpath" -- to specify the Java classes used to help implement the shell.
//	However, there are no known use cases for this configurability, so the functionality was removed.

//	TODO	can this be run with Java 6/7 jrunscript?
//
//	TODO	convert jsh build script to a jsh script that runs in an unbuilt shell
//
//	TODO	create semi-automated verify process that includes non-automatable features (like debugger)
//
//	TODO	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
//
//	TODO	At one point, was investigating using jjs as Nashorn launcher; is this still a good idea? If so, would using the
//			Rhino shell as main make sense for the Rhino case?
//
//	TODO	Implement Rhino profiler; probably needs to move to main.js
//
//		} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
//			//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
//			//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
//			//	from settings:
//			//	this.profiler = JSH_HOME.getFile("tools/profiler.jar");
//			if (settings.get("profiler") && JSH_SHELL_CONTAINER == "jvm") {
//				var withParameters = /^profiler\:(.*)/.exec(env.JSH_SCRIPT_DEBUGGER);
//				if (withParameters) {
//					command.add("-javaagent:" + settings.get("profiler").path + "=" + withParameters[1]);
//				} else {
//					command.add("-javaagent:" + settings.get("profiler").path);
//				}
//			} else {
//				//	TODO	allow explicit setting of profiler agent location when not running in ordinary built shell
//				//	emit warning message?
//			}
//		}
//
//	TODO	Provide runtime access to plugin path, with jsh.shell.jsh.plugins?

try {
	if (!this.$api.slime) {
		$api.script.resolve("slime.js").load();
		$api.log("Loaded slime.js: src=" + $api.slime.src);
	}

	if ($api.slime.setting("jsh.launcher.debug")) {
		$api.debug.on = true;
		$api.debug("debugging enabled");
	}

	$api.jsh = {};

	$api.jsh.exit = $api.engine.resolve({
		rhino: function(status) {
			var _field = Packages.java.lang.Class.forName("org.mozilla.javascript.tools.shell.Main").getDeclaredField("exitCode");
			_field.setAccessible(true);
			if (status === null) {
				_field.set(null, new Packages.java.lang.Integer(Packages.inonit.script.jsh.launcher.Engine.Rhino.NULL_EXIT_STATUS));
			} else {
				_field.set(null, new Packages.java.lang.Integer(status));
			}
		},
		nashorn: function(status) {
			if (status !== null) {
				Packages.java.lang.System.exit(status);
			}
		}
	});

	$api.jsh.engines = {
		rhino: {
			main: "inonit.script.jsh.Rhino",
			resolve: function(o) {
				return o.rhino;
			}
		},
		nashorn: {
			main: "inonit.script.jsh.Nashorn",
			resolve: function(o) {
				return o.nashorn;
			}
		}
	};

	$api.jsh.engine = (function() {
		var engines = $api.jsh.engines;
		if ($api.slime.settings.get("jsh.engine")) {
			return (function(setting) {
				return engines[setting];
			})($api.slime.settings.get("jsh.engine"));
		}
		return $api.engine.resolve(engines);
	})();

	var Classpath = function(_urls) {
		var colon = String(Packages.java.io.File.pathSeparator);

		this.append = function(classpath) {
			this._urls.push.apply(this._urls,classpath._urls);
		}

		this._urls = (function(_urls) {
			var rv = [];
			if (_urls) {
				for (var i=0; i<_urls.length; i++) {
					rv.push(_urls[i]);
				}
			}
			return rv;
		})(_urls);

		var files = function() {
			var rv = [];
			for (var i=0; i<this._urls.length; i++) {
				var pathname;
				if (!this._urls[i].getProtocol) throw new Error("Not URL: " + this._urls[i]);
				if (String(this._urls[i].getProtocol()) != "file") {
		//			var tmpdir = new Directory(String($api.io.tmpdir().getCanonicalPath()));
		//
		//			var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
		//			if (rhino) {
		//				$api.debug("Copying rhino ...");
		//				var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
		//				var writeTo = rhinoCopiedTo.writeTo();
		//				$api.io.copy(rhino,writeTo);
		//			}
					throw new Error("Not a file: " + this._urls[i]);
				} else {
					pathname = new Packages.java.io.File(this._urls[i].toURI()).getCanonicalPath();
				}
				rv.push(pathname);
			}
			return rv;
		};

		this.local = function() {
			return files.call(this).join(colon);
		}
	};

	//	TODO	Merge below with above
	$api.jsh.Classpath = Classpath;

	$api.java.compile = function(p) {
		var toIterable = function(array) {
			var _rv = new Packages.java.util.ArrayList();
			for (var i=0; i<array.length; i++) {
				_rv.add(array[i]);
			}
			return _rv;
		};

		var javac = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
		var _jfm = new JavaAdapter(
			Packages.javax.tools.JavaFileManager,
			new function() {
				var _delegate = javac.getStandardFileManager(null, null, null);

				this.flush = function() {
				}

				this.hasLocation = function(_location) {
					var location = String(_location.getName());
					var rv = ({
						ANNOTATION_PROCESSOR_PATH: false,
						SOURCE_PATH: false,
						NATIVE_HEADER_OUTPUT: false
					})[location];
					if (typeof(rv) == "undefined") {
						throw new Error("Unknown hasLocation location: " + location);
					}
					return rv;
				};

				var DirectoryDestination = function(_file) {
					var ClassFile = function(_file) {
						//Packages.java.lang.System.err.println("Writing: " + _file);
						return new JavaAdapter(
							Packages.javax.tools.JavaFileObject,
							new function() {
								this.openOutputStream = function() {
									return new Packages.java.io.FileOutputStream(_file);
								}

								this.delete = function() {
									return _file.delete();
								};

								this.toUri = function() {
									throw new Error("Unimplemented: toUri");
								}
							}
						);
					}

					this.getJavaFileForOutput = function(name,kind,_sibling) {
						if (kind == "CLASS") {
							var path = name.replace(/\./g, "/") + ".class";
							var _to = new Packages.java.io.File(_file,path);
							_to.getParentFile().mkdirs();
							return new ClassFile(_to);
						} else {
							throw new Error("unimplemented: directory output " + name + " " + kind + " " + _sibling);
						}
						throw new Error("unimplemented: directory output " + name + " " + kind + " " + _sibling)
					}
				};

				var destination = (function() {
					return new DirectoryDestination(p.destination);
				})();

				this.getJavaFileForOutput = function(_location,_className,_kind,_sibling) {
					var location = String(_location.name());
					var outputs = new function() {
						this.CLASS_OUTPUT = function(_location,_className,_kind,_sibling) {
							return destination.getJavaFileForOutput(_location,_className,_kind,_sibling);
						}
					};
					var outputter = outputs[location];
					if (!outputter) throw new Error("unimplemented: output " + _location + " " + _className + " " + _kind + " " + _sibling);
					return outputter(String(_className),String(_kind),_sibling);
				}

				var classpath = new (function(_urls) {
					this.getClassLoader = function() {
						var __urls = new $api.java.Array({ type: Packages.java.net.URL, length: p.classpath.length });
						for (var i=0; i<_urls.length; i++) {
							__urls[i] = p.classpath[i];
						}
						return new Packages.java.net.URLClassLoader(__urls);
					};

					var DirectoryElement = function(_url) {
						this.toString = function() {
							return "DirectoryElement: " + _url;
						}

						this.list = function(packageName,kinds,recurse) {
							throw new Error("Unimplemented in " + this + ": packageName=" + packageName + " kinds=" + kinds + " recurse=" + recurse);
						}
					}

					var classFiles = {};

					this.classFiles = classFiles;

					var ClassFile = function(path,_bytes) {
						return new JavaAdapter(
							Packages.javax.tools.JavaFileObject,
							new function() {
								this.toString = function() {
									return "ClassFile: " + path;
								};

								this.getName = function() {
									return path;
								}

								classFiles[this.toString()] = {
									binaryName: (function() {
										var name = path.substring(0,path.length-".class".length);
										return name.replace(/\//g, ".");
									})()
								}

								this.openInputStream = function() {
									return new Packages.java.io.ByteArrayInputStream(_bytes);
								}

								this.getKind = function() {
									return Packages.javax.tools.JavaFileObject.Kind.CLASS;
								}

								this.toUri = function() {
									throw new Error("Unimplemented: toUri");
								}
							}
						);
					}

					var JarFileElement = function(file) {
						var JarEntry = function(path,_stream) {
							var _ostream = new Packages.java.io.ByteArrayOutputStream();
							$api.io.copy(_stream,_ostream);
							_ostream.close();
							_stream.close();
							var _bytes = _ostream.toByteArray();

							this.input = function() {
								return new ClassFile(path,_bytes);
							}
						}

						var _jar = new Packages.java.util.jar.JarFile(file);
						var _entries = _jar.entries();
						var entries = {};
						while(_entries.hasMoreElements()) {
							var _entry = _entries.nextElement();
							var path = String(_entry.getName());
							if (/\/$/.test(path)) {
								//	directory; skip
							} else {
								entries[String(_entry.getName())] = new JarEntry(path, _jar.getInputStream(_entry));
							}
						}
						//Packages.java.lang.System.err.println("Done with entries");

						this.toString = function() {
							return "JarFileElement: " + file;
						}

						this.list = function(packageName,kinds,recurse) {
							//Packages.java.lang.System.err.println("packageName = " + packageName + " kinds = " + kinds);
							var rv = [];
							if (kinds.CLASS) {
								var prefix = packageName.replace(/\./g,"/") + "/";
								for (var x in entries) {
									var path = x.split("/");
									var IN_PACKAGE_FILTER = (recurse) ? true : (path.length == packageName.split(".").length+1);
									if (x.substring(0,prefix.length) == prefix && IN_PACKAGE_FILTER) {
										rv.push(entries[x].input());
									}
								}
							}
							if (kinds.SOURCE) {
								//	No source code in JAR files
							}
							return rv;
						}
					};

					var elements;

					var getElements = function() {
						var rv = [];
						for (var i=0; i<_urls.length; i++) {
							var protocol = String(_urls[i].getProtocol());
							var element;
							if (protocol == "file") {
								var file = new Packages.java.io.File(_urls[i].toURI());
								var basename = String(file.getName());
								if (/\.jar$/.test(basename)) {
									element = new JarFileElement(file);
								} else if (file.exists() && file.isDirectory()) {
									element = new DirectoryElement(file);
								} else {
									//	not anything
									Packages.java.lang.System.err.println("file = " + file);
								}
							} else {
								Packages.java.lang.System.err.println("protocol: " + protocol);
							}
							if (element) {
								rv.push(element);
							}
						}
						return rv;
					}

					this.list = function(_packageName,_setOfKinds,recurse) {
						var kinds = {};
						//Packages.java.lang.System.err.println("package: " + _packageName + " kinds " + _setOfKinds + " recurse " + recurse);
						kinds.toString = function() {
							var rv = [];
							for (var x in this) {
								if (x != "toString") {
									rv.push(x);
								}
							}
							return rv.join(" | ");
						}
						var _i = _setOfKinds.iterator();
						while(_i.hasNext()) {
							kinds[_i.next().name()] = true;
						}
						if (!elements) {
							elements = getElements();
						}
						//Packages.java.lang.System.err.println("package: " + _packageName + " kinds " + kinds + " recurse " + recurse);
						var rv = [];
						//Packages.java.lang.System.err.println("_urls = " + _urls);
						for (var i=0; i<elements.length; i++) {
							var list = elements[i].list(String(_packageName),kinds,recurse);
							rv.push.apply(rv,list);
						}
						//Packages.java.lang.System.err.println("rv: " + rv);
						var _rv = toIterable(rv);
						//Packages.java.lang.System.err.println("_rv: " + _rv);
						return _rv;
					};
				})(p.classpath);

				this.getClassLoader = function(_location) {
					var location = String(_location.getName());
					var classLoaders = new function() {
						this.CLASS_PATH = function() {
							return classpath.getClassLoader();
						}
					};
					if (!classLoaders[location]) throw new Error("Unknown ClassLoader location: " + location);
					return classLoaders[location]();
				};

				this.list = function(_location,_packageName,_setOfKinds,recurse) {
					//Packages.java.lang.System.err.println("list " + _location + " " + _packageName + " " + _setOfKinds + " " + recurse);
					var listers = new function() {
						this.PLATFORM_CLASS_PATH = function() {
							return _delegate.list(_location,_packageName,_setOfKinds,recurse);
						}

						this.CLASS_PATH = function() {
							return classpath.list(_packageName,_setOfKinds,recurse);
						}
					};
					var location = String(_location.getName());
					if (!listers[location]) throw new Error("No lister for " + location);
					return listers[location](_location,_packageName,_setOfKinds,recurse);
				}

				this.inferBinaryName = function(_location,_jfo) {
					var location = String(_location.name());
					var binaryNamers = new function() {
						this.PLATFORM_CLASS_PATH = function(_location,_jfo) {
							return _delegate.inferBinaryName(_location,_jfo);
						};

						this.CLASS_PATH = function(_location,_jfo) {
							var rv = classpath.classFiles[_jfo.toString()].binaryName;
							return rv;
						}
					};
					var binarynamer = binaryNamers[location];
					if (!binarynamer) throw new Error("No inferBinaryName for " + _location);
					return binarynamer(_location,_jfo);
				}
			}
		);
		var _writer = null;
		var _listener = null; /* javax.tools.DiagnosticListener */
		var _annotationProcessorClasses = null;

		var SourceFile = function(_url) {
			return new JavaAdapter(
				Packages.javax.tools.JavaFileObject,
				new function() {
					this.toString = function() {
						return _url.toExternalForm();
					}

					this.getName = function() {
						return _url.toExternalForm();
					}

					this.getKind = function() {
						return Packages.javax.tools.JavaFileObject.Kind.SOURCE;
					}

					this.getCharContent = function() {
						return new Packages.java.lang.String($api.engine.readUrl(_url.toExternalForm()));
//						throw new Error("getCharContent: " + _url);
					}

					this.isNameCompatible = function(name,kind) {
						if (String(name) == "package-info") return false;
						var tokens = String(_url.toExternalForm()).split("/");
						var basename = tokens[tokens.length-1];
						if (kind.name().equals("SOURCE")) return basename = name + ".java";
						throw new Error("isNameCompatible: " + _url + " name " + name + " kind " + kind);
					}

					this.toUri = function() {
						return _url.toURI();
					}
				}
			);
		};

		//	JavaFileObject
		var _units = p.files.map(function(file) {
			return new SourceFile(file);
		});
		Packages.java.lang.System.err.println(_units.join("\n"));

		var task = javac.getTask(_writer, _jfm, _listener, toIterable(["-Xlint:unchecked"]), _annotationProcessorClasses, toIterable(_units));
		var success = task.call();
		if (!success) {
			throw new Error("Java compilation failed.");
		}
	}

	$api.jsh.Unbuilt = function(rhino) {
		this.toString = function() {
			return "Unbuilt: src=" + $api.slime.src + " rhino=" + rhino;
		}

		this.rhino = rhino;

		if (false) this.profiler = (function() {
			if ($api.slime.settings.get("jsh.shell.profiler")) {
				return new Packages.java.io.File($api.slime.settings.get("jsh.shell.profiler"));
			}
		})();

		this.shellClasspath = function() {
			if (!$api.slime.src) throw new Error("Could not detect SLIME source root for unbuilt shell.")
			if (rhino && rhino.length) rhino = new Classpath(rhino);
			var LOADER_CLASSES = $api.io.tmpdir();
			if ($api.slime.src.File) {
				var toCompile = $api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/java"));
				if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/rhino")));
				toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("rhino/system/java")));
				toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/java")));
				if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/rhino")));
				var rhinoClasspath = (rhino) ? ["-classpath", rhino.local()] : [];
				$api.java.install.compile([
					"-Xlint:unchecked",
					"-d", LOADER_CLASSES
				].concat(rhinoClasspath).concat(toCompile));
			} else {
				var toCompile = $api.slime.src.getSourceFilesUnder("loader/rhino/java/");
				if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder("loader/rhino/rhino/"));
				toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder("rhino/system/java/"));
				toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder("jsh/loader/java/"));
				if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder("jsh/loader/rhino/"));
				$api.java.compile({
					classpath: (rhino) ? rhino._urls : [],
					destination: LOADER_CLASSES,
					files: toCompile
				});
			}
			return [LOADER_CLASSES.toURI().toURL()];
		};
	};

	$api.jsh.Built = function(home) {
		this.toString = function() {
			return "Built: " + home + " rhino=" + rhino;
		}

		this.home = home;

		if (new Packages.java.io.File(home, "lib/js.jar").exists()) {
			this.rhino = [new Packages.java.io.File(home, "lib/js.jar").toURI().toURL()];
		}

		if (new Packages.java.io.File(home, "tools/profiler.jar").exists()) {
			this.profiler = new Packages.java.io.File(home, "tools/profiler.jar");
		}

		this.shellClasspath = function() {
			return [new Packages.java.io.File(home, "lib/jsh.jar").toURI().toURL()];
		}
	};

	$api.jsh.Packaged = function(file) {
		this.packaged = file;

		//	TODO	test and enable (and document) if this works
		if (false) this.profiler = (function() {
			if ($api.slime.settings.get("jsh.shell.profiler")) {
				return new Packages.java.io.File($api.slime.settings.get("jsh.shell.profiler"));
			}
		})();

		this.shellClasspath = function() {
			return [file.toURI().toURL()];
		};
	};

	if (Packages.java.lang.System.getProperties().get("jsh.launcher.shell")) {
		$api.jsh.shell = new (function(peer) {
			var getRhinoClasspath = function() {
				var classpath = peer.getRhinoClasspath();
				if (classpath) {
					return new Classpath(classpath);
				} else {
					return null;
				}
			};

			var Unbuilt = function(src) {
				return new $api.jsh.Unbuilt(src,getRhinoClasspath());
			};

			var Built = function(home) {
				return new $api.jsh.Built(home);
			};

			var Packaged = function(file) {
				return new $api.jsh.Packaged(file);
			};

			var shell = (function(peer) {
				if (peer.getPackaged()) {
					$api.debug("Setting packaged shell: " + String(peer.getPackaged().getCanonicalPath()));
					return new Packaged(peer.getPackaged());
				} else if (peer.getHome()) {
					$api.debug("Setting built shell: " + String(peer.getHome().getCanonicalPath()));
					return new Built(peer.getHome());
				} else {
					return new Unbuilt(new Packages.java.io.File($api.slime.setting("jsh.shell.src")));
				}
			})(peer);

			if (shell.home) {
				this.home = String(shell.home.getCanonicalPath());
			}
			if (shell.packaged) {
				this.packaged = String(shell.packaged.getCanonicalPath());
			}

			this.rhino = (getRhinoClasspath()) ? getRhinoClasspath().local() : null;

			this.classpath = function() {
				var rv = new Classpath();

				$api.jsh.engine.resolve({
					rhino: function() {
						rv.append(getRhinoClasspath());
					},
					nashorn: function() {
					}
				})();

				rv.append(new Classpath(shell.shellClasspath()));

				return rv;
			};
		})(Packages.java.lang.System.getProperties().get("jsh.launcher.shell"));
	}

	if ($api.jsh.shell && $api.jsh.shell.packaged) {
		if ($api.arguments.length == 0 && !$api.jsh.shell.packaged) {
			$api.console("Usage: " + $api.script.file + " <script-path> [arguments]");
			//	TODO	should replace the below with a mechanism that uses setExitStatus, adding setExitStatus for Rhino throwing a
			//			java.lang.Error so that it is not caught
			$api.jsh.exit(1);
		}

		$api.debug("Launcher environment = " + JSON.stringify($api.shell.environment, void(0), "    "));
		$api.debug("Launcher working directory = " + Packages.java.lang.System.getProperty("user.dir"));
		$api.debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

		$api.debug("Creating command ...");
		var command = new $api.java.Command();

		var container = (function() {
			//	TODO	test whether next line necessary
			if ($api.jsh.shell.packaged) return "jvm";
			if ($api.slime.settings.get("jsh.shell.container")) return $api.slime.settings.get("jsh.shell.container");
			return "classloader";
		})();
		if (container == "jvm") {
			command.fork();
		}

		(function vmArguments() {
			//	TODO	what about jsh.jvm.options? If it is set, the options may already have been applied by launcher and we may not need
			//			to add them and fork a VM; launcher could *unset* them, perhaps. Need to think through and develop test case
			if ($api.jsh.shell.packaged) return;
			var rv = [];
			while($api.arguments.length && $api.arguments[0].substring(0,1) == "-") {
				command.vm($api.arguments.shift());
			}
			return rv;
		})();

		//	Make the launcher classpath available to help with launching subshells
		$api.slime.settings.set("jsh.launcher.classpath", String(Packages.java.lang.System.getProperty("java.class.path")));

		//	Describe the shell
		if ($api.jsh.shell.rhino) $api.slime.settings.set("jsh.engine.rhino.classpath", $api.jsh.shell.rhino);

		$api.slime.settings.sendPropertiesTo(function(name,value) {
			command.systemProperty(name,value);
		});

		//	TODO	If the container is classloader, presumably could use URLs or push the files switch back into $api.java.Command
		var classpath = $api.jsh.shell.classpath()._urls;
		for (var i=0; i<classpath.length; i++) {
			command.classpath(classpath[i]);
		}

		command.main($api.jsh.engine.main);

		for (var i=0; i<$api.arguments.length; i++) {
			command.argument($api.arguments[i]);
		}

		$api.debug("Running command " + command + " ...");
		var status = command.run();
		$api.debug("Command returned: status = " + status);
		$api.jsh.exit(status);
	}
} catch (e) {
	$api.debug("Error:");
	$api.debug(e);
	$api.debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (e.printStackTrace) {
		e.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	} else if (e instanceof Error) {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
	}
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	var error = e;
	debugger;
	$api.jsh.exit(1);
}