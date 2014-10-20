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

			var getLoaderCode = function(path) {
				var _reader = installation.getJshLoader(path).getReader();
				return String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
			};

			this.getLoaderScript = function(path) {
				return {
					name: path,
					code: getLoaderCode(path)
				};
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
			getPlugins: function(_file) {
				return Packages.inonit.script.jsh.Installation.Plugin.get(_file);
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

	var Loader = eval(host.getLoader().getLoaderScript("loader.js").code);

	var plugins = {};
	var loadPlugins = eval(host.getLoader().getLoaderScript("plugins.js").code);

	var loader = new Loader();

	this.loader = new function() {
		this.run = loader.run;
		this.file = loader.file;
		this.module = loader.module;
		this.namespace = loader.namespace;

		//	experimental interface and therefore currently undocumented
		this.addFinalizer = function(f) {
			addFinalizer(f);
		}

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
		};

		this.plugins = function(from) {
			if (from && from.java && from.java.adapt && loader.getRhinoLoader().classpath.getClass("java.io.File").isInstance(from.java.adapt())) {
				loadPlugins(host.getPlugins(from.java.adapt()));
			}
		};
	};

	//	TODO	should separate everything above/below into two files; above is loader implementation, below is
	//			startup/configuration

	//	TODO	Lazy-loading
	var js = loader.bootstrap("js/object",{ globals: true });
	jsh.js = js;

	var java = loader.bootstrap("rhino/host", { globals: true, $rhino: loader.getRhinoLoader(), $java: $host.java });
	jsh.java = java;

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

	loadPlugins(host.getLoader().getPlugins());

	jsh.$jsapi = {
		$platform: loader.$platform,
		$api: loader.$api,
		$rhino: loader.getRhinoLoader(),
		$coffee: $jsh.getInstallation().getLibrary("coffee-script.js"),
		java: $host.java
	};

	if ($host.getSystemProperties().get("inonit.tools.Profiler.args")) {
		(function() {
			var _args = $host.getSystemProperties().get("inonit.tools.Profiler.args");
			var options = {};
			//	TODO	currently does not contemplate repeated options
			for (var i=0; i<_args.length; i++) {
				var pair = String(_args[i]);
				var tokens = pair.split("=");
				options[tokens[0]] = tokens[1];
			}
			loader.getRhinoLoader().run(host.getLoader().getLoaderScript("profiler.js"), {
				jsh: jsh,
				options: options
			});
		})();
	}
};

jsh.loader.run({
		name: $jsh.getInvocation().getScript().getSource().getSourceName(),
		_in: $jsh.getInvocation().getScript().getSource().getReader()
	},
	this,
	this
);