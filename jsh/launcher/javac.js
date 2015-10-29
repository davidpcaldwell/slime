if (!$api.java) $api.java = {};
if (!$api.debug) $api.debug = function() {
};
$api.java.compile = function(p) {
	var toIterable = function(array) {
		var _rv = new Packages.java.util.ArrayList();
		for (var i=0; i<array.length; i++) {
			_rv.add(array[i]);
		}
		return _rv;
	};

	var javac = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
	var jfm = (
		new function() {
			$api.debug("Java file manager constructor invoked ...");
			var _delegate = javac.getStandardFileManager(null, null, null);
			$api.debug("_delegate constructed ...");

			["close","flush","getClassLoader","getFileForInput","getFileForOutput","getJavaFileForInput","getJavaFileForOutput",
			"handleOption","hasLocation","inferBinaryName","isSameFile","list","isSupportedOption"].forEach(function(name) {
				this[name] = function(){};
			},this);

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
							["delete","getCharContent","getLastModified","getName","openInputStream","openOutputStream","openReader",
							"openWriter","toUri","getAccessLevel","getKind","getNestingKind","isNameCompatible"].forEach(function(name) {
								this[name] = function(){};
							},this);

							this.openOutputStream = function() {
								return new Packages.java.io.FileOutputStream(_file);
							}

							this["delete"] = function() {
								return _file["delete"]();
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
			$api.debug("destination created ...");


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
							["delete","getCharContent","getLastModified","getName","openInputStream","openOutputStream","openReader",
							"openWriter","toUri","getAccessLevel","getKind","getNestingKind","isNameCompatible"].forEach(function(name) {
								this[name] = function(){};
							},this);

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
//						$api.debug("classpath list");
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
//							$api.debug("elements[" + i + "] = " + elements[i] + " package=" + _packageName + " list = " + list);
						rv.push.apply(rv,list);
					}
					//Packages.java.lang.System.err.println("rv: " + rv);
					for (var i=0; i<rv.length; i++) {
//							$api.debug("classpath[" + i + "] = " + rv[i] + " keys " + Object.keys(rv[i]));
					}
					var _rv = toIterable(rv);
					//Packages.java.lang.System.err.println("_rv: " + _rv);
//						$api.debug("classpath list return " + _rv);
					return _rv;
				};
			})(p.classpath);
			$api.debug("classpath created ...");

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
			};
			$api.debug("constructor finished ...");
		}
	);
	var IS_JDK_RHINO = typeof(Packages.com.sun.script.javascript.RhinoScriptEngine) == "function";
	if (IS_JDK_RHINO) {
		JavaAdapter = function(type,object) {
			return new Packages.com.sun.script.javascript.RhinoScriptEngine().getInterface(object,type);
		}
	}
	if (true) {
		try {
			var _jfm = new JavaAdapter(
				Packages.javax.tools.JavaFileManager,
				jfm
			);
		} catch (e) {
			$api.debug("e = " + e + " keys=" + Object.keys(e));
			$api.debug("e.stack = " + e.stack);
			$api.debug("e.rhinoException = " + e.rhinoException);
			$api.debug("Packages.javax.tools.JavaFileManager " + Packages.javax.tools.JavaFileManager);
			$api.debug("jfm = " + jfm);
			if (e.rhinoException) {
				e.rhinoException.printStackTrace();
			}
			throw e;
		}
	} else {
		var _jvm = direct;
	}
	var _writer = null;
	var _listener = null; /* javax.tools.DiagnosticListener */
	var _annotationProcessorClasses = null;

	var SourceFile = function(_url) {
		return new JavaAdapter(
			Packages.javax.tools.JavaFileObject,
			new function() {
				//	JDK	1.6 Rhino requires that Object methods that are invoked be defined in these implementations
				this.equals = function(other) { return other != null && String(_url.toExternalForm().toString()) == String(other.toString()); };
				this.hashCode = function() { return 1; };

				//	JDK 1.7 Rhino requires that all interface methods be defined even if they are not used
				["delete","getCharContent","getLastModified","getName","openInputStream","openOutputStream","openReader",
				"openWriter","toUri","getAccessLevel","getKind","getNestingKind","isNameCompatible"].forEach(function(name) {
					this[name] = function(){};
				},this);
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
					if (kind.name().equals("SOURCE")) return basename == (name + ".java");
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
	$api.debug("_jfm = " + _jfm);
	$api.debug("_jfm.getClass() = " + _jfm.getClass());
	$api.debug(_units.map(function(x) {
		var rv = [];
		var c = x.getClass();
		while(c.getSuperclass()) {
			rv.push(c);
			if (c.getInterfaces()) {
				for (var i=0; i<c.getInterfaces().length; i++) {
					rv.push(c.getInterfaces()[i]);
				}
			}
			c = c.getSuperclass();
		}
		return rv.join("|");
	}).join("\n"));

	var task = javac.getTask(_writer, _jfm, _listener, toIterable(["-Xlint:unchecked"]), _annotationProcessorClasses, toIterable(_units));
	$api.debug("task = " + task);
	try {
		var success = task.call();
		$api.debug("Compilation succeeded");
		if (!success) {
			throw new Error("Java compilation failed.");
		}
	} catch (e) {
		if (e.rhinoException) {
			e.rhinoException.printStackTrace();
		}
		throw e;
	}
}

