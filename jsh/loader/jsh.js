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

		this.plugin = new function() {
			this.read = function(_code,scope) {
				return rhinoLoader.run({
					_source: _code.getScripts(),
					path: "plugin.jsh.js"
				}, scope);
			};
			this.file = function(_code,path,context) {
				return rhinoLoader.file(
					{
						_source: _code.getScripts(),
						path: path
					},
					{ $context: context }
				);
			};
			this.module = function(_code,main,context) {
				return rhinoLoader.module(
					{
						_code: _code,
						main: main
					},
					{ $context: context }
				);
			};
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

		var Loader = function(_source) {
			var getCode = function(path) {
				return {
					_source: _source,
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
						_source,
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

			this.resource = function(path) {
				var _in = _source.getResourceAsStream(path);
				if (!_in) return null;
				return jsh.io.java.adapt(_in);
			}
		}

		var self = this;
		this.Loader = function(directory) {
			var args = function() {
				var toArray = function() {
					var rv = [];
					for (var i=0; i<arguments.length; i++) {
						rv[i] = arguments[i];
					}
					return rv;
				}

				var rv = toArray.apply(null, arguments);
				rv[0] = directory.getRelativePath(arguments[0]);
				return rv;
			}

			this.run = function(path) {
				return self.run.apply(null, args.apply(null, arguments));
			}

			this.file = function(path) {
				return self.file.apply(null, args.apply(null, arguments));
			}

			this.module = function(path) {
				return self.module.apply(null, args.apply(null, arguments));
			}
		}
		//	Below code was in earlier version from jsh/script; worth reviewing, especially SlimeDirectory
//$exports.Loader = function(paths) {
//	//	TODO	do we also need the analog of loader.run()?
//	this.file = function(path) {
//		var args = [ paths.file(path) ];
//		for (var i=1; i<arguments.length; i++) {
//			args[i] = arguments[i];
//		}
//		return jsh.loader.file.apply(jsh.loader,args);
//	}
//
//	this.module = function(path) {
//		var args = [ paths.module(path) ];
//		for (var i=1; i<arguments.length; i++) {
//			args[i] = arguments[i];
//		}
//		return jsh.loader.module.apply(jsh.loader,args);
//	}
//}
//$exports.Loader.Paths = function(base) {
//	this.file = function(path) {
//		return base.getRelativePath(path);
//	}
//
//	this.module = function(path) {
//		return base.getRelativePath(path);
//	}
//}
//$exports.Loader.SlimeDirectory = function(dir) {
//	return function(path) {
//		return dir.getRelativePath(path.substring(0,path.length-1).replace(/\//g,".") + ".slime")
//	}
//}
//$api.experimental($exports,"Loader");

		if ($host.getLoader().getPackagedCode()) {
			this.bundled = new Loader($host.getLoader().getPackagedCode());
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
			debugger;
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

	(function() {
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
	})();

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
		return loader.bootstrap({
			api: {
				file: jsh.file,
				addClasses: jsh.loader.addClasses
			},
			workingDirectory: jsh.shell.PWD,
			script: (function() {
				if ($host.getInvocation().getScript().getFile()) {
					return jsh.file.filesystem.$jsh.Pathname($host.getInvocation().getScript().getFile()).file;
				}
				return null;
			})(),
			packaged: (function() {
				//	TODO	push back into Invocation
				if ($host.getSystemProperties().getProperty("jsh.launcher.packaged")) {
					return jsh.file.filesystem.$jsh.Pathname(
						new Packages.java.io.File(
							$host.getSystemProperties().getProperty("jsh.launcher.packaged")
						)
					).file;
				}
				return null;
			})(),
			arguments: jsh.java.toJsArray($host.getInvocation().getArguments(), function(s) { return String(s); }),
			Loader: loader.Loader,
			loader: loader.bundled
		},"jsh/script");
	})();

	if (jsh.script) {
		//	Need to do this rather than jsh.shell.getopts = deprecate(jsh.script.getopts) because of not copying function properties
		//	(issue 13)
		jsh.shell.getopts = jsh.script.getopts;
		loader.$api.deprecate(jsh.shell, "getopts");
	}

	jsh.$jsapi = {
		$platform: loader.$platform,
		$api: loader.$api
	};

	(function() {
		var _plugins = $host.getLoader().getPlugins();
		var list = [];

		for (var i=0; i<_plugins.length; i++) {
			var _code = _plugins[i].getCode();
			var scope = {};
			//	TODO	$host is currently automatically in scope for these plugins, but that is probably not as it should be; see
			//			issue 32
			scope.plugin = function(p) {
				list.push(p);
			}
			scope.jsh = jsh;
			scope.$loader = new (function(_code) {
				this.file = function(path,context) {
					return loader.plugin.file(_code,path,context);
				}
				this.module = function(path,context) {
					return loader.plugin.module(_code,path,context);
				}
			})(_code);
			loader.plugin.read(_code,scope);
		}

		var stop = false;
		while(list.length > 0 && !stop) {
			var marked = false;
			var i = 0;
			while(i < list.length && !marked) {
				if (list[i].isReady()) {
					list[i].load();
					list.splice(i,1);
					marked = true;
				}
				i++;
			}
			if (list.length > 0 && !marked) {
				//	Some plugin was never ready
				debugger;
				stop = true;
			}
		}
	})();
};