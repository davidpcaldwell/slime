var $host = new function() {
	var installation;
	var invocation;
	
	if (Packages.java.lang.System.getProperty("jsh.launcher.packaged") != null) {
		installation = Packages.inonit.script.jsh.Installation.packaged();
		invocation = Packages.inonit.script.jsh.Invocation.packaged($engine.getArguments());
	} else {
		installation = Packages.inonit.script.jsh.Installation.unpackaged();
		if ($engine.getArguments().length == 0) {
			throw new Error("No arguments supplied; is this actually a packaged application? system properties = " + Packages.java.lang.System.getProperties());
		}
		invocation = Packages.inonit.script.jsh.Invocation.create($engine.getArguments());
	}
	
	this.getRhinoLoader = function() {
		var debug = function(string) {
			Packages.java.lang.System.err.println(string);
		}
		
		var _Streams = Packages.inonit.script.runtime.io.Streams;
		var _streams = new _Streams();
		
		var getLoaderCode = function(path) {
//			return installation
//			var loaderPath = Packages.java.lang.System.getProperty("jsh.library.scripts.loader");
//			if (!loaderPath && Packages.java.lang.System.getProperty("jsh.launcher.packaged")) {
//				throw new Error("getLoaderCode not implemented correctly for packaged applications; loading " + path);
//			}
//			var _File = Packages.java.io.File;
//			var _FileReader = Packages.java.io.FileReader;
			var rv = _streams.readString(installation.getPlatformLoader(path).getReader());
			return rv;
		}
		
		var toScope = function(object) {
			if ($engine.toScope) return $engine.toScope(object);
			return object;
		}
		
		//	Try to port inonit.script.rhino.Loader.Bootstrap
		var $rhino = new function() {
			this.getLoaderCode = function(path) {
				return getLoaderCode(path);
			};

			//	TODO	is this indirection object unnecessary?
			var classpath = new function() {
				this.append = function(code) {
					$engine.getClasspath().append(code);
				};
				
				this.getClass = function(name) {
					return $engine.getClasspath().getClass(name);
				}
			};

			this.getClasspath = function() {
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
