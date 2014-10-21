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
	(function() {
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

		$host.loader = new function() {
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

		$host.getPlugins = function(_file) {
			return Packages.inonit.script.jsh.Installation.Plugin.get(_file);
		};
	})();

	var jsh = this;

	var loader = eval($host.loader.getLoaderScript("loader.js").code);

	var loadPlugins = eval($host.loader.getLoaderScript("plugins.js").code);

	//	TODO	examine why needed by plugins; rename if it is needed

	this.loader = new function() {
		this.run = loader.run;
		this.file = loader.file;
		this.module = loader.module;
		this.namespace = loader.namespace;

		//	experimental interface and therefore currently undocumented
		this.addFinalizer = function(f) {
			$host.loader.addFinalizer(new JavaAdapter(
				Packages.java.lang.Runnable,
				{
					run: function() {
						f();
					}
				}
			));
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
			if (from && from.java && from.java.adapt && $host.classpath.getClass("java.io.File").isInstance(from.java.adapt())) {
				loadPlugins($host.getPlugins(from.java.adapt()));
			}
		};
	};

	//	TODO	should separate everything above/below into two files; above is loader implementation, below is
	//			startup/configuration

	//	TODO	Lazy-loading of plugins
	loadPlugins($host.loader.getPlugins());

	//	TODO	below could be turned into jsh plugin loaded at runtime by jsapi; would need to make getLibrary accessible through
	//			$host
	jsh.$jsapi = {
		$platform: $host.$platform,
		$api: $host.$api,
		$rhino: $host,
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
			$host.run($host.loader.getLoaderScript("profiler.js"), {
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