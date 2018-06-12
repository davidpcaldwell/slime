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
	//	TODO	rename $host, which makes no sense as a name now (it is not a host object). Perhaps $slime?
	var $host = (function($jsh) {
		var $host = $jsh.runtime();
		var configuration = $jsh.getEnvironment();
		var invocation = $jsh.getInvocation();

		$host.getSystemProperties = function() {
			return configuration.getSystemProperties();
		};
		
		//	Could consider returning empty string for null; this seems to be the way properties are used
		$host.getSystemProperty = function(name) {
			var _rv = configuration.getSystemProperties().getProperty(name);
			if (_rv === null) return null;
			return String(_rv);
		}

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

		$host.loader = new function() {
			this.getPackagedCode = function() {
				return configuration.getPackagedCode();
			};

			var getLoaderCode = function(path) {
				var _reader = $jsh.getJshLoader().getFile(path).getReader();
				return String(new Packages.inonit.script.runtime.io.Streams().readString(_reader));
			};

			this.getLoaderScript = function(path) {
				return {
					name: "jsh://" + path,
					string: getLoaderCode(path)
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

		$host.coffee = $jsh.getLibrary("coffee-script.js");

		return $host;
	})($jsh);

	//	TODO	is there a way to use the custom script executor to do these rather than eval()?

	var loader = $host.value(
		$host.loader.getLoaderScript("loader.js"),
		{
			$host: $host
		}
	);

	var plugins = $host.value(
		$host.loader.getLoaderScript("plugins.js"),
		{
			$slime: $host,
			jsh: this,
			loader: loader
		}
	);
	
	$host.plugins = {
		mock: function(p) {
			plugins.mock(p);
		}
	};

	this.loader = new function() {
		this.run = loader.run;
		this.file = loader.file;
		this.module = loader.module;
		this.value = loader.value;
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

			this.getClass = function(name) {
				return loader.classpath.get(name);
			}
		};

		this.plugins = function(from) {
			if (from && from.java && from.java.adapt && $host.classpath.getClass("java.io.File").isInstance(from.java.adapt())) {
				//	TODO	trying to unify this with the plugins.load interface to have just one plugins search mechanism
				plugins._load($host.getInterface().getPlugins(from.java.adapt()));
			} else if (from && from.get) {
				plugins.load(from);
			}
		};
	};

	if (true) {
		plugins._load($host.getInterface().getPlugins());
	} else {
		//	TODO	this implementation in plugins.load probably does not 
		var loader = new $host.Loader({ _source: $host.getInterface().getPluginSource() })
		plugins.load(loader);
	}

	//	TODO	below could be turned into jsh plugin loaded at runtime by jsapi; would need to make getLibrary accessible through
	//			$host

	if ($host.getSystemProperties().get("inonit.tools.Profiler.args")) {
		$host.run($host.loader.getLoaderScript("profiler.js"), {
			jsh: this,
			$host: $host
		});
	}
};

jsh.loader.run({
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