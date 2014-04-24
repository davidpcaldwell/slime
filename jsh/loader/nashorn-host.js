var $host = new function() {
	this.getRhinoLoader = function() {
		var debug = function(string) {
			Packages.java.lang.System.err.println(string);
		}
		
		var _Streams = Java.type("inonit.script.runtime.io.Streams");
		var _streams = new _Streams();
		
		var getLoaderCode = function(path) {
			var loaderPath = Java.type("java.lang.System").getProperty("jsh.library.scripts.loader");
			var _File = Java.type("java.io.File");
			var _FileReader = Java.type("java.io.FileReader");
			debug(loaderPath);
			var rv = _streams.readString(new _FileReader(new _File(new _File(loaderPath), path)));
			Packages.java.lang.System.err.println(rv);
			return rv;
		}
		
		var Context = Java.type("jdk.nashorn.internal.runtime.Context");
		var evaluateSourceSignature = new (Java.type("java.lang.Class[]"))(3);
		var Source = Java.type("jdk.nashorn.internal.runtime.Source");
		var ScriptObject = Java.type("jdk.nashorn.internal.runtime.ScriptObject");
		evaluateSourceSignature[0] = Source.class;
		evaluateSourceSignature[1] = ScriptObject.class;
		evaluateSourceSignature[2] = ScriptObject.class;
		var evaluateSource = Context.class.getDeclaredMethod("evaluateSource", evaluateSourceSignature);
		evaluateSource.setAccessible(true);
		debug("evaluateSource = " + evaluateSource);
		var script = function(name,code,scope,target) {
			var context = Context.getContext();
//			return context.evaluateSource(new Source(name,code), scope, target);
			debug("scope = " + scope + " target = " + target);
			var notNull = function(o) {
				return (o) ? o : {};
			}
			return evaluateSource.invoke(context, new Source(name,code), notNull(scope), notNull(target));
		};
		
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
			
			var classpath = new function() {
				this.append = function(code) {
					throw new Error("Cannot append " + code.getClasses());
				}
			}

			this.getClasspath = function() {
				//	TODO	implement modifications if possible
				//	This value, I believe, is interpreted to mean that the classpath cannot be modified, or something
				//	The Java code appears to allow it but the Rhino loader blows up on the Hello World case so it probably is not
				//	OK at least in jsh (remember dimly that another embedding might have somehow handled the no class loader case)
				//	return null;
				return classpath;
			};

			this.script = function(name,input,scope,target) {
				debug("loading: " + name);
				return script(name,_streams.readString(input),scope,target);
			};
			
			this.setReadOnly = function(object,name,value) {
				//	TODO	implement
			}
		};
		
		var Context = Java.type("jdk.nashorn.internal.runtime.Context");
		var context = Context.getContext();
		debug("context = " + context);
		debug("eval = " + eval);
		return script("<nashorn loader>", getLoaderCode("rhino/literal.js"), toScope({ $rhino: $rhino }), null);
	};
	
	var installation = Java.type("inonit.script.jsh.Installation").unpackaged();
	
	//	Returns port of inonit.script.jsh.Shell.Host.Interface.Loader
	this.getLoader = function() {
		return new function() {
			//	implementation duplicates original
			this.getBootstrapModule = function(path) {
				return installation.getShellModuleCode(path);
			};
		}
	}
};
