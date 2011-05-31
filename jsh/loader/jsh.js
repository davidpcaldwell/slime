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
		$host.addFinalizer(new JavaAdapter(
			Packages.java.lang.Runnable,
			{
				run: function() {
					f();
				}
			}
		))
	}

	var loader = new function() {
		var rhinoLoader = (function() {
			var $loader = new function() {
				this.code = String($host.getRhinoLoaderBootstrap().getPlatformCode());
				this.script = function(name,$in,scope,target) {
					if (!target) target = null;
					$host.script(name,$in,scope,target);
				}
			};

			return eval( String($host.getRhinoLoaderBootstrap().getRhinoCode()) );
		})();

		rhinoLoader.$api.deprecate.warning = function(o) {
			debugger;
		}

		this.$platform = rhinoLoader.$platform;
		this.$api = rhinoLoader.$api;

		this.bootstrap = function(context,path) {
			return rhinoLoader.module($host.getBootstrapModule(path), { $context: context });
		}
		
		this.run = function(pathname,scope,target) {
			return rhinoLoader.run({
				name: pathname.toString(),
				$in: new Packages.java.io.FileInputStream(pathname.java.adapt())
			},scope,target);
		}

		this.file = function(pathname,$context) {
			return rhinoLoader.file({
				name: pathname.toString(),
				$in: new Packages.java.io.FileInputStream(pathname.java.adapt())
			}, $context);
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
				return rhinoLoader.module($host.getPackedModule(format.slime,format.name),p);
			} else if (format.base) {
				return rhinoLoader.module($host.getUnpackedModule(format.base,format.name),p);
			} else {
				throw "Unreachable code: format.slime and format.base null in jsh loader's module()";
			}
		}

		this.namespace = function(name) {
			return rhinoLoader.namespace(name);
		}

		if ($host.getBundledModules()) {
			this.bundled = new function() {
				this.module = function(path) {
					if (path.substring(path.length-1) == "/") {
						path += "module.js";
					}
					var tokens = path.split("/");
					var p = {};
					if (arguments.length == 2) {
						p.$context = arguments[1];
					}
					return rhinoLoader.module(
						$host.getBundledModules().load(
							tokens.slice(0,tokens.length-1).join("/")
							,tokens[tokens.length-1]
						),
						p
					);
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
		}

		this.addFinalizer = function(f) {
			addFinalizer(f);
		}
		
		this.script = function() {
			//	deprecated
			debugger;
			return loader.file.apply(this,arguments);
		}
	};

	//	TODO	Lazy-loading
	var js = loader.bootstrap({ globals: true },"js/object");
	jsh.js = js;

	var java = loader.bootstrap(
		new function() {
			this.experimental = function() {};
			this.classLoader = $host.getClassLoader();
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
			this.$out = $host.getStandardOutput();
			this.$in = $host.getStandardError();
			this.$err = $host.getStandardError();
		}

		context.$pwd = String( $shell.properties.user.dir );

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
		context.exit = function(code) {
			$host.exit(code);
		}
		return loader.bootstrap(context,"jsh/shell");
	})();

	jsh.script = (function() {
		var context = {
			$script: $host.getInvocation().getScriptFile(),
			$arguments: $host.getInvocation().getArguments(),
			addClasses: function(pathname) {
				$host.addClasses(pathname.java.adapt());
			}
		};
		context.api = {
			file: jsh.file,
			java: jsh.java
		};
		
		return loader.bootstrap(context,"jsh/script");
	})();

	if (jsh.script) {
		jsh.shell.getopts = jsh.script.getopts;
		loader.$api.deprecate(jsh.shell,"deprecate");
	}

	jsh.$jsapi = {
		$platform: loader.$platform,
		$api: loader.$api
	}
};
