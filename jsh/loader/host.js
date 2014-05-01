var $host = new function() {
	var installation = $shell.getInstallation();
	var configuration = $shell.getConfiguration();	
	var invocation = $shell.getInvocation();
	
	var loader;
	
	this.getRhinoLoader = function() {
		if (!loader) {
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

				if ($engine.setReadOnly) {
					this.setReadOnly = $engine.setReadOnly;
				}
				
				if ($engine.MetaObject) {
					this.MetaObject = $engine.MetaObject;
				}
			};

			loader = $engine.script("rhino/literal.js", getLoaderCode("rhino/literal.js"), toScope({ $rhino: $rhino }), null);
		}
		return loader;
	};
	
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
	
	var global = (function() { return this; })();
	
	this.jsapi = new function() {
		if (global.$nashorn) {
			this.script = function(name,code,scope) {
				return $engine.script(name, String(code), scope);
			}
		}		
	};
};
