var $host = new function() {
	this.getRhinoLoader = function() {
		var debug = function(string) {
			Packages.java.lang.System.err.println(string);
		}
		
		var _Streams = Packages.inonit.script.runtime.io.Streams;
		var _streams = new _Streams();
		
		var getLoaderCode = function(path) {
			var loaderPath = Packages.java.lang.System.getProperty("jsh.library.scripts.loader");
			var _File = Packages.java.io.File;
			var _FileReader = Packages.java.io.FileReader;
			var rv = _streams.readString(new _FileReader(new _File(new _File(loaderPath), path)));
			return rv;
		}
		
		var toScope = function(scope) {
			var global = (function() { return this; })();
			if (false) {
				var rv = {};
				for (var x in global) {
					rv[x] = global[x];
				}
				for (var x in scope) {
					rv[x] = scope[x];
				}
				return rv;
			} else {
				scope.__proto__ = global;
				return scope;
			}
		}
		
		//	Try to port inonit.script.rhino.Loader.Bootstrap
		var $rhino = new function() {
			this.getLoaderCode = function(path) {
				return getLoaderCode(path);
			};

//			var classpath = $nashorn.getClasspath();
			var classpath = new function() {
				this.append = function(code) {
					$engine.getClasspath().append(code);
				}
			};
//			var classpath = new function() {
//				this.append = function(code) {
//					throw new Error("Cannot append " + code.getClasses());
//				}
//			}

			this.getClasspath = function() {
				//	TODO	implement modifications if possible
				//	This value, I believe, is interpreted to mean that the classpath cannot be modified, or something
				//	The Java code appears to allow it but the Rhino loader blows up on the Hello World case so it probably is not
				//	OK at least in jsh (remember dimly that another embedding might have somehow handled the no class loader case)
				//	return null;
				return classpath;
			};

			this.script = function(name,input,scope,target) {
				return $engine.script(name,_streams.readString(input),toScope(scope),target);
			};
			
			this.setReadOnly = function(object,name,value) {
				//	TODO	implement
			}
		};
		
		return $engine.script("rhino/literal.js", getLoaderCode("rhino/literal.js"), toScope({ $rhino: $rhino }), null);
	};
	
	var installation;
	var invocation;
	
	if (Packages.java.lang.System.getProperty("jsh.launcher.packaged") != null) {
		installation = Packages.inonit.script.jsh.Installation.packaged();
		invocation = Packages.inonit.script.jsh.Invocation.packaged($engine.getArguments());
	} else {
		installation = Packages.inonit.script.jsh.Installation.unpackaged();
		invocation = Packages.inonit.script.jsh.Invocation.create($engine.getArguments());
	}
	
	var configuration = Packages.inonit.script.jsh.Shell.Configuration.main();
	
	this.getInvocation = function() {
		return invocation;
	}
	
	//	Returns port of inonit.script.jsh.Shell.Host.Interface.Loader
	this.getLoader = function() {
		return new function() {
			//	implementation duplicates original
			this.getBootstrapModule = function(path) {
				return installation.getShellModuleCode(path);
			};
			
			this.getPlugins = function() {
				return installation.getPlugins();
			}
			
			this.getPackagedCode = function() {
				return configuration.getPackagedCode();
			}
		}
	};
	
	this.getEnvironment = function() {
		return configuration.getEnvironment();
	};
	
	this.getSystemProperties = function() {
		return configuration.getSystemProperties();
	}
	
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
	
	this.getStdio = function() {
		return stdio;
	}
	
	this.getPlugins = function(file) {
		return Packages.inonit.script.jsh.Installation.Plugin.get(file);
	}
};
