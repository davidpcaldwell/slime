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
	var $slime = (function($jsh) {
		var $slime = $jsh.runtime();
		var configuration = $jsh.getEnvironment();
		var invocation = $jsh.getInvocation();

		$slime.getSystemProperties = function() {
			return configuration.getSystemProperties();
		};
		
		//	Could consider returning empty string for null; this seems to be the way properties are used
		$slime.getSystemProperty = function(name) {
			var _rv = configuration.getSystemProperties().getProperty(name);
			if (_rv === null) return null;
			return String(_rv);
		}

		$slime.getEnvironment = function() {
			return configuration.getEnvironment();
		};

		$slime.getStdio = function() {
			return stdio;
		};

		$slime.getInvocation = function() {
			return invocation;
		};

		$slime.getPackaged = function() {
			return configuration.getPackaged();
		}

		$slime.getInterface = function() {
			return $jsh.getInterface();
		}

		$slime.loader = new function() {
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

		$slime.coffee = $jsh.getLibrary("coffee-script.js");

		return $slime;
	})($jsh);

	(function initializeDeprecation() {
		//	TODO	The name prefix used below is duplicative of the one in js/debug/plugin.jsh.js, so not DRY currently
		var _log = function(_logger,_level,mask) {
			var substitutions = Array.prototype.slice.call(arguments,3);
			if (_logger.isLoggable(_level)) {
				var _message = Packages.java.lang.String.format(mask, substitutions);
				_logger.log(_level, _message);
			}
		}

		$slime.$api.deprecate.warning = function(o) {
			var name = arguments.callee.javaLogName;
			var _level = Packages.java.util.logging.Level.WARNING;
			var _logger = Packages.java.util.logging.Logger.getLogger(name);
			var _traceLevel = Packages.java.util.logging.Level.FINE;
			if (o.callee) {
				if (o.object && o.property) {
					_log(_logger, _level, "Use of deprecated method %s of object %s", String(o.property), String(o.object));
				} else {
					_log(_logger, _level, "Use of deprecated function %s", String(o.callee));
				}
			} else if (o.object && o.property) {
				_log(_logger, _level, "Access to deprecated property %s of object %s", String(o.property), String(o.object));
			}
			if (_logger.isLoggable(_traceLevel)) {
				//	TODO	disable break on error
				_log(_logger, _traceLevel, "Stack trace of deprecated usage:\n%s", String(new Error().stack));
			}
			debugger;
		};
		$slime.$api.deprecate.warning.javaLogName = "inonit.script.jsh.Shell.log.$api.deprecate";		
	})();
	
	var plugins = $slime.value(
		$slime.loader.getLoaderScript("plugins.js"),
		{
			$slime: $slime,
			jsh: this
		}
	);
	
	$slime.plugins = {
		mock: function(p) {
			plugins.mock(p);
		}
	};

	this.loader = new function() {
		var getCode = function(code) {
			if (typeof(code) == "undefined") throw new TypeError("'code' must not be undefined.");
			if (code === null) throw new TypeError("'code' must not be null.");
			//	This check determines whether the object is a Pathname; is there a way to do that in the rhino/file module itself?
			//	TODO	presumably the run/file methods should only support file objects, not directories or pathnames not
			//			corresponding to files ... or else what should they do if the file is not found? Maybe file could return
			//			null or something ... but run would probably have to fail silently, which is not good unless it is
			//			explicitly specified
			if (code.java && code.java.adapt() && $slime.classpath.getClass("java.io.File").isInstance(code.java.adapt())) {
				return {
					name: code.toString(),
					string: (function() {
						var _in = new Packages.java.io.FileInputStream(code.java.adapt());
						var rv = String(new Packages.inonit.script.runtime.io.Streams().readString(_in));
						return rv;
					})()
				};
			} else {
				return code;
			}
		}

		this.run = function(code,scope,target) {
			return $slime.run(getCode(code),scope,target);
		};

		this.value = function(code,scope,target) {
			return $slime.value(getCode(code),scope,target);
		};

		this.file = function(code,$context) {
			return $slime.file(getCode(code),$context);
		};
		
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
			var loader = (function(format) {
				if (format.slime) return new $slime.Loader({ zip: { _file: format.slime } });
				if (format.base) return new $slime.Loader({ _file: format.base });
				throw new TypeError("Unreachable code: format.slime and format.base null in jsh loader's module()");
			})(format);
			if (format.slime) {
				$slime.classpath.add({ slime: { loader: loader } });
			}
			var args = [format.name].concat(Array.prototype.slice.call(arguments,1));
			return loader.module.apply(loader,args);
		};

		this.namespace = function(name) {
			return $slime.namespace(name);
		}

		//	experimental interface and therefore currently undocumented
		this.addFinalizer = function(f) {
			$slime.loader.addFinalizer(new JavaAdapter(
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
				return $slime.classpath.toString();
			}

			this.add = function(pathname) {
				if (!pathname) throw new TypeError("'pathname' must be provided and not undefined or null.");
				if (!pathname.directory && !pathname.file) {
					return;
				}
				$slime.classpath.add({ _file: pathname.java.adapt() });
			};

			this.getClass = function(name) {
				return $slime.classpath.getClass(name);
			}
		};

		this.plugins = function(from) {
			var isPathname = from && from.java && from.java.adapt && $slime.classpath.getClass("java.io.File").isInstance(from.java.adapt());
			var isFile = from && from.pathname && from.pathname.file;
			var isDirectory = from && from.pathname && from.pathname.directory;
			if (isPathname) {
				if (from.file) {
					plugins.load({ zip: { _file: from.java.adapt() } });						
				} else if (from.directory) {
					plugins.load({ _file: from.java.adapt() });						
				} else {
					//	TODO	log a message
				}
			} else if (from && from.get) {
				plugins.load({ loader: from });
			} else if (isFile) {
				//	Should we be sending a script resource, rather than a Java file? Could expose that API in loader/rhino/literal.js
				plugins.load({ zip: { _file: from.pathname.java.adapt() } });
			} else if (isDirectory) {
				plugins.load({ _file: from.pathname.java.adapt() });
			}
		};
	};

	(function loadPlugins() {
		var _sources = $slime.getInterface().getPluginSources();
		for (var i=0; i<_sources.length; i++) {
			plugins.load({ loader: new $slime.Loader({ _source: _sources[i] }) });
		}
	})();

	//	TODO	below could be turned into jsh plugin loaded at runtime by jsapi; would need to make getLibrary accessible through
	//			$slime

	if ($slime.getSystemProperties().get("inonit.tools.Profiler.args")) {
		$slime.run($slime.loader.getLoaderScript("profiler.js"), {
			jsh: this,
			_properties: $slime.getSystemProperties()
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