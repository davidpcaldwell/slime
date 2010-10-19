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

//	HOST VARIABLE: $host (Java class: inonit.script.jsh.ScriptHost)

(function() {
	var jsh = this;

	var loader = new function() {
		var rhinoLoader = (function() {
			var $delegate = $host.getRhinoLoaderBootstrap();

			var $loader = new function() {
				this.code = String($delegate.getPlatformCode());
				this.script = function(scope,name,$in) {
					$host.script(scope,name,$in);
				}
			};

			return eval( String($delegate.getRhinoCode()) );
		})();

		var EVALUATE_SCRIPTS_AS_STRINGS = false;

		this.$platform = rhinoLoader.$platform;
		this.$api = rhinoLoader.$api;

		this.bootstrap = function(context,path) {
			return rhinoLoader.module($host.getBootstrapModule(path), { $context: context });
		}

		this.module = function(pathname) {
			var format = {};
			if (pathname.directory) {
				if (!pathname.directory.getFile("module.js")) {
					return null;
				}
				format.base = pathname.$peer.getHostFile();
				format.name = "module.js";
			} else if (pathname.file && /\.slime$/.test(pathname.basename)) {
				format.base = pathname.$peer.getHostFile();
				format.name = "module.js";
			} else if (pathname.file) {
				format.base = pathname.parent.$peer.getHostFile();
				format.name = pathname.basename;
			} else {
				return null;
			}
			var p = {};
			if (arguments.length == 2) {
				p.$context = arguments[1];
			}
			return rhinoLoader.module($host.getModule(format.base,format.name,null),p);
		}

		this.script = function(pathname,$context) {
			if (EVALUATE_SCRIPTS_AS_STRINGS) {
				//	load as string
				var code = $host.getScriptCode(pathname.$peer.getHostFile());
				if (code == null) throw "Script not found: " + pathname;
				return rhinoLoader.script(String(code),$context);
			} else {
				return rhinoLoader.script({
					name: pathname.toString(),
					$in: new Packages.java.io.FileInputStream(pathname.$peer.getHostFile())
				}, $context);
			}
		}

		this.namespace = function(name) {
			return rhinoLoader.namespace(name);
		}
	}

	this.loader = new function() {
		this.module = loader.module;
		this.script = loader.script;
		this.namespace = loader.namespace;
	};

	//	TODO	Lazy-loading
	var js = loader.bootstrap({},"js/object");
	jsh.js = js;

	var java = loader.bootstrap(
		new function() {
			this.experimental = function() {};
			this.classLoader = $host.getClassLoader();
		},
		"rhino/host"
	);
	jsh.java = java;

	var $shell = loader.bootstrap({
		api: {
			java: java
		}
	},"rhino/shell");

	new function() {
		var context = {};
		context.api = {
			js: js,
			java: java
		}
		if ($shell) {
			//	TODO	Need to check for $shell existence when initializing under test.jsh.js, at least for now
			if ( String($shell.properties.cygwin) != "undefined" ) {
				var convert = function(value) {
					if ( String(value) == "undefined" ) return function(){}();
					if ( String(value) == "null" ) return null;
					return String(value);
				}
				context.cygwin = {
					root: convert( $shell.properties.cygwin.root ),
					paths: convert( $shell.properties.cygwin.paths ),
				}
			}
			context.$pwd = String( $shell.properties.user.dir );
		}
		jsh.file = loader.bootstrap(
			context,
			"rhino/file"
		);
	}

	new function() {
		var context = {};
		context.api = {
			java: java,
			shell: $shell,
			file: jsh.file
		}
		context.exit = function(code) {
			$host.exit(code);
		}
		jsh.shell = loader.bootstrap(context,"jsh/shell");
	}

	jsh.script = (function() {
		var context = {};
		context.api = {
			file: jsh.file,
			java: jsh.java
		};
		context.$host = {
			script: $host.getInvocation().getScript(),
			arguments: $host.getInvocation().getArguments(),
			addClasses: function($file) {
				$host.addClasses($file);
			}
		}
		
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
}).call(this);
