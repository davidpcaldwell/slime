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
		var configuration = $jsh.getEnvironment();
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

		$host.getPackaged = function() {
			return configuration.getPackaged();
		}

		$host.getInterface = function() {
			return $jsh.getInterface();
		}

//		$host.getPackageFile = function() {
//			var packaged = configuration.getPackaged();
//			return (packaged) ? packaged.getFile() : null;
//		}
//
//		$host.getPackagedCode = function() {
//			var packaged = configuration.getPackaged();
//			return (packaged) ? packaged.getCode() : null;
//		};

		$host.loader = new function() {
			this.getPlugins = function() {
				return $jsh.getPlugins();
			}

			this.getPackagedCode = function() {
				return configuration.getPackagedCode();
			};

			var getLoaderCode = function(path) {
				var _reader = $jsh.getJshLoader().getFile(path).getReader();
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
			return $jsh.getInterface().getPlugins(_file);
		};

		$host.coffee = $jsh.getLibrary("coffee-script.js");
	})();

	var jsh = this;

	//	TODO	is there a way to use the custom script executor to do this rather than eval()?
	var loader = eval($host.loader.getLoaderScript("loader.js").code);

	var loadPlugins = eval($host.loader.getLoaderScript("plugins.js").code);

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

	loadPlugins($host.loader.getPlugins());

	//	TODO	below could be turned into jsh plugin loaded at runtime by jsapi; would need to make getLibrary accessible through
	//			$host

	if ($host.getSystemProperties().get("inonit.tools.Profiler.args")) {
		$host.run($host.loader.getLoaderScript("profiler.js"), {
			jsh: jsh,
			$host: $host
		});
	}
};

jsh.loader.run({
		name: $jsh.getInvocation().getScript().getSource().getSourceName(),
		code: (function() {
			var _reader = $jsh.getInvocation().getScript().getSource().getReader();
			return String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
		})()
	},
	this,
	this
);