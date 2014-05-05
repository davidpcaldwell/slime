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

//	HOST VARIABLE: $host (Java class: inonit.script.jsh.Shell.Host.Interface)

this.jsh = new function() {
	var jsh = this;

	var addFinalizer = function(f) {
		$host.getLoader().addFinalizer(new JavaAdapter(
			Packages.java.lang.Runnable,
			{
				run: function() {
					f();
				}
			}
		));
	}

	var loader = new function() {
		//	TODO	naming conventions are inconsistent in this stuff; look at how there are addClasses methods and classpath.add().
		//			generally speaking, should probably match the rhinoLoader API across all of these representations of it
		var rhinoLoader = (function() {
			var rv = $host.getRhinoLoader();
			rv.$api.deprecate.warning = function(o) {
				debugger;
			}
			return rv;
		})();

		this.getRhinoLoader = function() {
			return rhinoLoader;
		};

		this.$platform = rhinoLoader.$platform;
		this.$api = rhinoLoader.$api;

		this.bootstrap = function(path,context) {
			var loader = new rhinoLoader.Loader({
				_code: $host.getLoader().getBootstrapModule(path)
			});
			return loader.module("module.js", { $context: context });
		}

		var getCode = function(code) {
			if (typeof(code) == "undefined") throw new TypeError("'code' must not be undefined.");
			if (code === null) throw new TypeError("'code' must not be null.");
			//	This check determines whether the object is a Pathname; is there a way to do that in the rhino/file module itself?
			//	TODO	presumably the run/file methods should only support file objects, not directories or pathnames not
			//			corresponding to files ... or else what should they do if the file is not found? Maybe file could return
			//			null or something ... but run would probably have to fail silently, which is not good unless it is
			//			explicitly specified
			if (code.java && code.java.adapt() && rhinoLoader.classpath.getClass("java.io.File").isInstance(code.java.adapt())) {
				return {
					name: code.toString(),
					_in: new Packages.java.io.FileInputStream(code.java.adapt())
				};
			} else {
				return code;
			}
		}

		var Loader = function(p) {
			return new jsh.io.Loader(p);
		}

		this.Loader = Loader;

		this.plugin = new function() {
			this.read = function(_code,scope) {
				var loader = new Loader({ _source: _code.getScripts() });
				return loader.run("plugin.jsh.js", scope);
			};
			this.run = function(_code,path,scope,target) {
				rhinoLoader.run(
					{
						_source: _code.getScripts(),
						path: path
					},
					scope,
					target
				);
			};
			this.file = function(_code,path,context) {
				return rhinoLoader.file(
					{
						_source: _code.getScripts(),
						path: path
					},
					context
				);
			};
			this.module = function(_code,main,context) {
				var loader = new Loader({ _code: _code });
				return loader.module(main, { $context: context });
			};
			this.addClasses = function(_code) {
				rhinoLoader.classpath.add(_code.getClasses());
			}
		}

		this.run = function(code,scope,target) {
			return rhinoLoader.run(getCode(code),scope,target);
		}

		this.file = function(code,$context) {
			return rhinoLoader.file(getCode(code),$context);
		}

		this.module = function(pathname) {
			var format = {};
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
			if (format.slime) {
				var descriptor = rhinoLoader.Module.packed(format.slime,format.name);
				var loader = new Loader({ _code: descriptor._code });
				return loader.module(format.name,p);
//				return rhinoLoader.module(rhinoLoader.Module.packed(format.slime,format.name),p);
			} else if (format.base) {
				var descriptor = rhinoLoader.Module.unpacked(format.base,format.name);
				var loader = new Loader({ _code: descriptor._code });
				return loader.module(format.name,p);
//				return rhinoLoader.module(rhinoLoader.Module.unpacked(format.base,format.name),p);
			} else {
				throw "Unreachable code: format.slime and format.base null in jsh loader's module()";
			}
		}

		this.classpath = new function() {
			this.toString = function() {
				return rhinoLoader.classpath.toString();
			}

			this.add = function(_file) {
				rhinoLoader.classpath.add(Packages.inonit.script.engine.Code.Source.create(_file));
			};

			this.get = function(name) {
				return rhinoLoader.classpath.getClass(name);
			}
		};

		this.namespace = function(name) {
			return rhinoLoader.namespace(name);
		}
	}

	this.loader = new function() {
		this.run = loader.run;
		this.file = loader.file;
		this.module = loader.module;
		this.namespace = loader.namespace;

		this.addFinalizer = function(f) {
			addFinalizer(f);
		}

		this.script = loader.$api.deprecate(loader.file);

		this.java = new function() {
			this.toString = function() {
				return loader.classpath.toString();
			}

			this.add = function(pathname) {
				if (!pathname) throw new TypeError("'pathname' must be provided and not undefined or null.");
				if (!pathname.directory && !pathname.file) {
					return;
				}
				loader.classpath.add(pathname.java.adapt());
			};
		}

		this.addClasses = loader.$api.deprecate(function(pathname) {
			this.java.add(pathname);
		});

		this.$getClass = loader.$api.deprecate(function(name) {
			return loader.classpath.get(name);
		});
	};

	//	TODO	should separate everything above/below into two files; above is loader implementation, below is
	//			startup/configuration

	//	TODO	Lazy-loading
	var js = loader.bootstrap("js/object",{ globals: true });
	jsh.js = js;

	var java = loader.bootstrap("rhino/host", { globals: true, $rhino: loader.getRhinoLoader() });
	jsh.java = java;

	var plugins = {};

	(function() {
		var context = {};
		var environment = jsh.java.Environment($host.getEnvironment());
		var properties = jsh.java.Properties.adapt($host.getSystemProperties());

		context._streams = new Packages.inonit.script.runtime.io.Streams();

		context.api = {
			loader: loader.getRhinoLoader(),
			js: js,
			java: java
		}

		if (environment.PATHEXT) {
			context.pathext = environment.PATHEXT.split(";");
		}

		//	TODO	check to see whether this is used, because if it is, it had a longstanding copy-paste bug
		context.stdio = new function() {
			this.$out = $host.getStdio().getStandardOutput();
			this.$in = $host.getStdio().getStandardInput();
			this.$err = $host.getStdio().getStandardError();
		}

		//	TODO	both jsh.file and jsh.shell use this property; consider making it part of host object and/or shell configuration
		//			and pushing property-mapping back into inonit.script.jsh.Shell
		context.$pwd = String( $host.getSystemProperties().getProperty("user.dir") );

		context.addFinalizer = addFinalizer;

		if ( String(properties.cygwin) != "undefined" ) {
			var convert = function(value) {
				if ( String(value) == "undefined" ) return function(){}();
				if ( String(value) == "null" ) return null;
				return String(value);
			}
			context.cygwin = {
				root: convert( properties.cygwin.root ),
				paths: convert( properties.cygwin.paths )
			}
		}

		var io = loader.bootstrap("rhino/io", {
			$java: context._streams
			,$rhino: loader.getRhinoLoader()
			,stdio: context.stdio
			,api: {
				js: js,
				java: java,
				mime: loader.bootstrap("js/mime",{})
			}
		});

		jsh.io = io;
		context.api.io = io;

		jsh.file = loader.bootstrap("rhino/file", context);
	})();

	jsh.$jsapi = {
		$platform: loader.$platform,
		$api: loader.$api,
		$rhino: loader.getRhinoLoader()
	};

	var readPlugin = function(_code,callbacks) {
		if (_code.getScripts()) {
			var scope = {};
			//	TODO	$host is currently *automatically* in scope for these plugins, but that is probably not as it should be; see
			//			issue 32. $host *should* be in scope, though; we should just have to put it there manually.
			scope.plugins = plugins;
			scope.plugin = function(declaration) {
				if (typeof(declaration.isReady) == "undefined") {
					declaration.isReady = function() {
						return true;
					};
				}
				callbacks.script({ _code: _code, declaration: declaration });
			}
			scope.$jsh = loader.getRhinoLoader();
			scope.global = (function() { return this; })();
			scope.jsh = jsh;
			scope.$loader = new (function(_code) {
				this.file = function(path,context) {
					return loader.plugin.file(_code,path,context);
				};
				this.module = function(path,context) {
					return loader.plugin.module(_code,path,context);
				};
				this.run = function(path,scope,target) {
					return loader.plugin.run(_code,path,scope,target);
				};
				this.classpath = new function() {
					this.add = function(pathname) {
						return loader.classpath.add(pathname.java.adapt());
					}
				}
			})(_code);
			loader.plugin.read(_code,scope);
		} else {
			callbacks.java({ _code: _code });
		}
	};

	var loadPlugins = function(_plugins) {
		var list = [];
		for (var i=0; i<_plugins.length; i++) {
			var _code = _plugins[i].getCode();
			readPlugin(_code,{
				script: function(v) {
					list.push(v);
				},
				java: function(v) {
					loader.plugin.addClasses(v._code);
				}
			});
		}

		var stop = false;
		while(list.length > 0 && !stop) {
			var marked = false;
			var i = 0;
			//	TODO	should isReady be optional?
			while(i < list.length && !marked) {
				if (list[i].declaration.isReady()) {
					list[i].declaration.load();
					list.splice(i,1);
					marked = true;
				}
				i++;
			}
			if (list.length > 0 && !marked) {
				//	Some plugin was never ready
				stop = true;
				//	TODO	think harder about what to do
				list.forEach(function(item) {
					var message = (item.declaration.disabled) ? item.declaration.disabled() : "never returned true from isReady(): " + item.declaration.isReady;
					Packages.inonit.system.Logging.get().log(
						Packages.inonit.script.jsh.Shell,
						Packages.java.util.logging.Level.WARNING,
						"Plugin from " + item._code.getScripts() + " is disabled: " + message
					);
				});
			}
		}
	};

	this.loader.plugins = function(from) {
		if (from && from.java && from.java.adapt && loader.getRhinoLoader().classpath.getClass("java.io.File").isInstance(from.java.adapt())) {
			loadPlugins($host.getPlugins(from.java.adapt()));
		}
	};

	(function() {
		loadPlugins($host.getLoader().getPlugins());
	})();

	if ($host.getSystemProperties().getProperty("jsh.script.debugger")) {
		(function() {
			var property = String($host.getSystemProperties().getProperty("jsh.script.debugger"));
			var parser = /^profiler\:(.*)$/;
			if (parser.test(property)) {
				var options = {};
				parser.exec(property)[1].split(",").forEach(function(declaration) {
					var tokens = declaration.split("=");
					options[tokens[0]] = tokens[1];
				});
				if (options.listener || options.output) {
					Packages.inonit.tools.Profiler.javaagent().addListener(new JavaAdapter(
						Packages.inonit.tools.Profiler.Listener,
						new function() {
							var Code = function(_peer) {
								if (_peer && _peer.getSourceName && _peer.getLineNumbers && _peer.getFunctionName) {
									this.sourceName = String(_peer.getSourceName());
									this.lineNumbers = jsh.java.toJsArray(_peer.getLineNumbers(), function(v) {
										return v;
									});
									if (_peer.getFunctionName()) {
										this.functionName = String(_peer.getFunctionName());
									}
								} else if (_peer && _peer.getClassName && _peer.getMethodName && _peer.getSignature) {
									this.className = String(_peer.getClassName());
									this.methodName = String(_peer.getMethodName());
									this.signature = String(_peer.getSignature());
								} else if (_peer && _peer.getClass() && String(_peer.getClass().getName()) == "java.lang.String") {
									//	TODO	if we want to keep using this we should fix its idiosyncrasies, like the lack of all line numbers
									var parser = /^(.*) \[(.*)\-(.*)\](?: (.*)\(\))?$/.exec(String(_peer));
									if (!parser) throw new TypeError("No match for " + String(_peer));
									var tokens = String(_peer).split(" ");
									this.sourceName = parser[1];
									this.lineNumbers = [Number(parser[2]),Number(parser[3])];
									if (parser[4]) {
										this.functionName = parser[4];
									}
								} else {
								}
							}

							var Statistics = function(_peer) {
								this.count = _peer.getCount();
								this.elapsed = _peer.getElapsed();
							}

							var Node = function(_peer) {
								var Constructor = arguments.callee;

								this.code = new Code(_peer.getCode());
								this.statistics = new Statistics(_peer.getStatistics());
								this.children = jsh.java.toJsArray(_peer.getChildren(), function(_child) {
									return new Constructor(_child);
								});
							}

							var Timing = function(_peer) {
								this.root = new Node(_peer.getRoot());
							}

							var Profile = function(_peer) {
								this.thread = {
									name: String(_peer.getThread().getName())
								};

								this.timing = new Timing(_peer.getTiming());
							};

							this.onExit = function(_profiles) {
								var profiles = jsh.java.toJsArray(_profiles, function(_profile) {
									return new Profile(_profile);
								});

								if (options.listener) {
									var _listener = new Packages.java.io.File(options.listener);
									var pathname = jsh.file.filesystems.os.Pathname(String(_listener.getCanonicalPath()));
									jsh.loader.run(pathname, {
										$loader: new loader.Loader({ _source: Packages.inonit.script.engine.Code.Source.create(_listener.getParentFile()) }),
										jsh: jsh,
										profiles: profiles
									});
								} else if (options.output && /\.html$/.test(options.output) && jsh.shell.jsh.home) {
									var pathname = jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer/module.js");
									//	TODO	the below would not work because when jsh.loader.module loads the module, it does not
									//			provide the module with a $loader which has been decorated with the jsh.io stuff
									//			(that is, the .resource() method). That's a bug and a redesign may be needed.
									//
									//			The good news is that we can now use the same scope strategy to send profiles (not
									//			putting it within $context).
									if (false) {
										jsh.loader.module(pathname, {
											profiles: profiles,
											to: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.output).getCanonicalPath()))
										});
									} else {
										jsh.loader.run(pathname, {
											$loader: new loader.Loader({ _source: Packages.inonit.script.engine.Code.Source.create(pathname.parent.java.adapt()) }),
											jsh: jsh,
											profiles: profiles,
											to: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.output).getCanonicalPath()))
										});
									}
								}
							}
						}
					));
				}
			}
		})();
		//	TODO	test for the existence of this class as well?
	}
};