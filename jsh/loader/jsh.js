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

this.jsh = new function() {
	var $host = $jsh.host();
	var host = (function() {
		var installation = $jsh.getInstallation();
		var configuration = $jsh.getConfiguration();
		var invocation = $jsh.getInvocation();

		$host.getSystemProperties = function() {
			return configuration.getSystemProperties();
		};

		$host.getEnvironment = function() {
			return configuration.getEnvironment();
		};

		$host.getStdio = function() {
			return stdio;
		};

		$host.getInvocation = function() {
			return invocation;
		};

		$host.getPackageFile = function() {
			return configuration.getPackageFile();
		}

		$host.getPackagedCode = function() {
			return configuration.getPackagedCode();
		};

		var loader = new function() {
			//	implementation duplicates original
			this.getBootstrapModule = function(path) {
				return installation.getShellModuleCode(path);
			};

			this.getPlugins = function() {
				return installation.getPlugins();
			}

			this.getPackagedCode = function() {
				return configuration.getPackagedCode();
			};
			
			this.getLoaderCode = function(path) {
				var _reader = installation.getJshLoader(path).getReader();
				return String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
			};
		};

		var stdio = new function() {
			var out = new Packages.java.io.PrintStream(configuration.getStdio().getStandardOutput());
			var err = new Packages.java.io.PrintStream(configuration.getStdio().getStandardError());

			this.getStandardInput = function() {
				return configuration.getStdio().getStandardInput();
			};

			this.getStandardOutput = function() {
				return out;
			};

			this.getStandardError = function() {
				return err;
			};
		};

		return {
			getLoader: function() {
				return loader;
			},
			getPlugins: function(file) {
				return Packages.inonit.script.jsh.Installation.Plugin.get(file);
			}
		};
	})();

	var jsh = this;

	var addFinalizer = function(f) {
		host.getLoader().addFinalizer(new JavaAdapter(
			Packages.java.lang.Runnable,
			{
				run: function() {
					f();
				}
			}
		));
	}
	
	var Loader = eval(host.getLoader().getLoaderCode("loader.js"));

	var loader = new Loader();

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

	var java = loader.bootstrap("rhino/host", { globals: true, $rhino: loader.getRhinoLoader(), $java: $host.java });
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
		$rhino: loader.getRhinoLoader(),
		$coffee: $jsh.getInstallation().getLibrary("coffee-script.js")
	};

	var loadPlugins = eval(host.getLoader().getLoaderCode("plugins.js"));

	this.loader.plugins = function(from) {
		if (from && from.java && from.java.adapt && loader.getRhinoLoader().classpath.getClass("java.io.File").isInstance(from.java.adapt())) {
			loadPlugins(host.getPlugins(from.java.adapt()));
		}
	};

	(function() {
		loadPlugins(host.getLoader().getPlugins());
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

jsh.loader.run({
		name: $jsh.getInvocation().getScript().getSource().getSourceName(),
		_in: $jsh.getInvocation().getScript().getSource().getReader()
	},
	this,
	this
);
