//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
		var rhinoLoader = $host.getRhinoLoader();

		rhinoLoader.$api.deprecate.warning = function(o) {
			debugger;
		}

		this.$platform = rhinoLoader.$platform;
		this.$api = rhinoLoader.$api;

		this.bootstrap = function(context,path) {
			return rhinoLoader.module(
				{ 
					_code: $host.getLoader().getBootstrapModule(path),
					main: "module.js"
				},
				{ $context: context }
			);
		}

		var getCode = function(code) {
			if (typeof(code) == "undefined") throw new RangeError("'code' must not be undefined.");
			if (code === null) throw new RangeError("'code' must not be null.");
			if (code.java && code.java.adapt() && rhinoLoader.classpath.getClass("java.io.File").isInstance(code.java.adapt())) {
				return {
					name: code.toString(),
					_in: new Packages.java.io.FileInputStream(code.java.adapt())
				};
			} else if (code.name && code._in) {
				//	fine as is
				return code;
			} else if (code.name && code.$in) {
				//	TODO	deprecate
				return {
					name: code.name,
					_in: code.$in
				}
			} else {
				return code;
			}
		}

		this.run = function(code,scope,target) {
			return rhinoLoader.run(getCode(code),scope,target);
		}

		this.file = function(code,$context) {
			return rhinoLoader.file(getCode(code), $context);
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
				return rhinoLoader.module(rhinoLoader.Module.packed(format.slime,format.name),p);
			} else if (format.base) {
				return rhinoLoader.module(rhinoLoader.Module.unpacked(format.base,format.name),p);
			} else {
				throw "Unreachable code: format.slime and format.base null in jsh loader's module()";
			}
		}

		this.addClasses = function(file) {
			rhinoLoader.classpath.add(Packages.inonit.script.rhino.Code.Source.create(file));
		}

		this.namespace = function(name) {
			return rhinoLoader.namespace(name);
		}

		if ($host.getLoader().getPackagedCode()) {
			this.bundled = new function() {
				//	TODO	the getCode(...) with run/file seems redundant; rhino loader could have API that loads from Code.Source
				var getCode = function(path) {
					return {
						_source: $host.getLoader().getPackagedCode(),
						path: path
					};
				}

				this.run = function(path,scope,target) {
					return rhinoLoader.run(getCode(path),scope,target);
				}

				this.file = function(path,$context) {
					return rhinoLoader.file(getCode(path),$context);
				}

				this.module = function(path) {
					var Code = Packages.inonit.script.rhino.Code;
					//	TODO	replace with a _source path main API
					var m = {
						_code: Code.create(Code.Source.create(
							$host.getLoader().getPackagedCode(),
							path
						)),
						main: "module.js"
					};
					var p = {};
					if (arguments.length == 2) {
						p.$context = arguments[1];
					}
					return rhinoLoader.module(m,p);
				}
			}
		}
	}

	this.loader = new function() {
		this.run = loader.run;
		this.file = loader.file;
		this.module = loader.module;
		this.namespace = loader.namespace;

		if (loader.bundled) {
			this.bundled = loader.bundled;
			loader.$api.deprecate(this,"bundled");
		}

		this.addFinalizer = function(f) {
			addFinalizer(f);
		}

		this.script = loader.$api.deprecate(loader.file);

		this.addClasses = function(pathname) {
			if (!pathname.directory && !pathname.file) {
				throw "Classes not found: " + pathname;
			}
			loader.addClasses(pathname.java.adapt());
		}
	};

	//	TODO	should separate everything above/below into two files; above is loader implementation, below is
	//			startup/configuration

	//	TODO	Lazy-loading
	var js = loader.bootstrap({ globals: true },"js/object");
	jsh.js = js;

	var java = loader.bootstrap(
		new function() {
			this.experimental = function() {};
			this.loadClass = function(name) {
				return $host.getLoader().getJavaClass(name);
			}
			this.globals = true;
		},
		"rhino/host"
	);
	jsh.java = java;

	var $shell = loader.bootstrap({
		api: {
			java: java
		},
		$environment: $host.getEnvironment(),
		$properties: $host.getSystemProperties()
	},"rhino/shell");

	new function() {
		var context = {};

		context._streams = new Packages.inonit.script.runtime.io.Streams();

		context.api = {
			js: js,
			java: java
		}

		context.stdio = new function() {
			this.$out = $host.getStdio().getStandardOutput();
			this.$in = $host.getStdio().getStandardError();
			this.$err = $host.getStdio().getStandardError();
		}

		context.$pwd = String( $host.getSystemProperties().getProperty("user.dir") );

		context.addFinalizer = addFinalizer;

		if ( String($shell.properties.cygwin) != "undefined" ) {
			var convert = function(value) {
				if ( String(value) == "undefined" ) return function(){}();
				if ( String(value) == "null" ) return null;
				return String(value);
			}
			context.cygwin = {
				root: convert( $shell.properties.cygwin.root ),
				paths: convert( $shell.properties.cygwin.paths )
			}
		}

		var io = loader.bootstrap({
			$java: new Packages.inonit.script.runtime.io.Streams()
			,stdio: context.stdio
			,api: {
				java: java
			}
		}, "rhino/io");

		context.api.io = io;

		jsh.io = io;

		jsh.file = loader.bootstrap(
			context,
			"rhino/file"
		);
	}

	jsh.shell = (function() {
		var context = {};
		context.api = {
			java: java,
			shell: $shell,
			io: jsh.io,
			file: jsh.file
		}
		context.getSystemProperty = function(name) {
			var rv = $host.getSystemProperties().getProperty(name);
			if (rv == null) return null;
			return String(rv);
		}
		context.exit = function(code) {
			$host.exit(code);
		}
		return loader.bootstrap(context,"jsh/shell");
	})();

	jsh.script = (function() {
		var context = {
			_invocation: $host.getInvocation()
		};
		context.api = {
			file: jsh.file,
			java: jsh.java,
			addClasses: jsh.loader.addClasses
		};

		return loader.bootstrap(context,"jsh/script");
	})();

	if (jsh.script && loader.bundled) {
		jsh.script.loader = loader.bundled;
	}

	if (jsh.script) {
		//	Need to do this rather than jsh.shell.getopts = deprecate(jsh.script.getopts) because of not copying function properties
		//	(issue 13)
		jsh.shell.getopts = jsh.script.getopts;
		loader.$api.deprecate(jsh.shell, "getopts");
	}

	jsh.$jsapi = {
		$platform: loader.$platform,
		$api: loader.$api
	}

	jsh.debug = (function() {
		return loader.bootstrap({},"jsh/debug");
	})();

	jsh.debug.disableBreakOnExceptionsFor = function(f) {
		return function() {
			var enabled = $host.getDebugger().isBreakOnExceptions();
			if (enabled) {
				$host.getDebugger().setBreakOnExceptions(false);
			}
			try {
				return f.apply(this,arguments);
			} finally {
				if (enabled) {
					$host.getDebugger().setBreakOnExceptions(true);
				}
			}
		}
	}
};