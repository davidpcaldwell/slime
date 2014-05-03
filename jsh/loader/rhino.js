var $engine = new function() {
	this.script = function(name,code,scope,target) {
		return $rhino.script(name,code,scope,target);
	};
	
	this.getClasspath = function() {
		return $rhino.getClasspath();
	};
	
	this.getDebugger = function() {
		return $rhino.getDebugger();
	};
	
	//	toScope apparently not necessary
	
	this.exit = function(status) {
		return $rhino.exit(status);
	};
	
	this.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};
	
	this.setReadOnly = function(object,name,value) {
		if (!arguments.callee.objects) {
			arguments.callee.objects = new Packages.inonit.script.rhino.Objects();
		}
		arguments.callee.objects.setReadOnly(object,name,value);							
	};
	
	this.MetaObject = function(p) {
		var delegate = (p.delegate) ? p.delegate : {};
		var get = (p.get) ? p.get : function(){};
		var set = (p.set) ? p.set : function(){};
		return Packages.inonit.script.rhino.MetaObject.create(delegate,get,set);
	};
	
	this.java = new function() {
		this.isJavaObjectArray = function(object) {
			//	TODO	would this work with Nashorn?
			return ( Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Object, 0).getClass().isInstance(object) );
		}
		this.isJavaInstance = function(object) {
			return String(object.getClass) == "function getClass() {/*\njava.lang.Class getClass()\n*/}\n";
		}
		this.getNamedJavaClass = function(name) {
			return Packages.org.mozilla.javascript.Context.getCurrentContext().getApplicationClassLoader().loadClass(name);
		}
		this.getJavaPackagesReference = function(name) {
			return Packages[name];
		}
		this.Array = function(JavaClass,length) {
			return Packages.java.lang.reflect.Array.newInstance(JavaClass,length);
		}
	}
	
	//	TODO	addFinalizer
	//	TODO	destroy
};
$engine.$javaloader = (function() {
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
		var rv = _streams.readString($shell.getInstallation().getPlatformLoader(path).getReader());
		return rv;
	}

	var $bootstrap = new function() {
		this.getLoaderCode = function(path) {
			return getLoaderCode(path);
		};
	}

	//	Try to port inonit.script.rhino.Loader.Bootstrap
	return $engine.script("rhino/rhino.js", getLoaderCode("rhino/rhino.js"), { $bootstrap: $bootstrap, $rhino: $rhino }, null);
})();