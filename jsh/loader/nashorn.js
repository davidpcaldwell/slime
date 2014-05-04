load("nashorn:mozilla_compat.js");

var $engine = new function() {
	var Context = Java.type("jdk.nashorn.internal.runtime.Context");
	var evaluateSourceSignature = new (Java.type("java.lang.Class[]"))(3);
	var Source = Java.type("jdk.nashorn.internal.runtime.Source");
	var ScriptObject = Java.type("jdk.nashorn.internal.runtime.ScriptObject");
	evaluateSourceSignature[0] = Source.class;
	evaluateSourceSignature[1] = ScriptObject.class;
	evaluateSourceSignature[2] = ScriptObject.class;
	var evaluateSource = Context.class.getDeclaredMethod("evaluateSource", evaluateSourceSignature);
	evaluateSource.setAccessible(true);
	this.script = function(name,code,scope,target) {
		var context = Context.getContext();
		var notNull = function(o) {
			return (o) ? o : {};
		}
		return evaluateSource.invoke(context, new Source(name,code), notNull(scope), notNull(target));
	};
	this.getClasspath = function() {
		return $nashorn.getClasspath();
	}
	
	var fakeDebugger = new function() {
		this.setBreakOnExceptions = function(b) {
		};
		
		this.isBreakOnExceptions = function() {
			return false;
		}
	};
	
	this.getDebugger = function() {
		return fakeDebugger;
	}
	
	this.toScope = function(scope) {
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
	
	this.exit = function(status) {
		if ($nashorn.isTop()) {
			exit(status);
		} else {
			//	NASHORN	Throwing object with toString() causes [object Object] to be error rather than toString()
			throw new Packages.inonit.script.jsh.Nashorn.ExitException(status);
		}
	}
	
	this.jsh = function(configuration,invocation) {
		var subshell = Packages.inonit.script.jsh.Shell.create(
			$shell.getInstallation(),
			configuration,
			invocation
		);
		var global = (function() { return this; })();
		var subglobal = Context.getContext().createGlobal();
		Context.setGlobal(subglobal);
		try {
			return Packages.inonit.script.jsh.Nashorn.execute(subshell);
		} catch (e) {
			return 255;
		} finally {
			Context.setGlobal(global);
		}
//		Integer rv = Rhino.execute(subshell, this.rhino, subinterface());
//		debugger.setBreakOnExceptions(breakOnExceptions);
//		if (rv == null) return 0;
//		return rv.intValue();		
	}
	
	this.java = new function() {
		this.isJavaObjectArray = function(object) {
			return (Java.type("java.lang.Object[]").class.isInstance(object));
		};
		this.isJavaInstance = function(object) {
			return typeof(object.getClass) == "function" && object.getClass() == Java.type(object.getClass().getName()).class;
		}
		this.getNamedJavaClass = function(name) {
			return Java.type(name).class;
		}
		this.getJavaPackagesReference = function(name) {
			return eval("Packages." + name);
		}
		this.Array = function(JavaClass,length) {
			return Packages.java.lang.reflect.Array.newInstance(JavaClass.class,length);
		}
	}
	
	//	TODO	setReadOnly?
	//	TODO	MetaObject?
};

var $javaloader = (function() {
	var _Streams = Packages.inonit.script.runtime.io.Streams;
	var _streams = new _Streams();

	var getLoaderCode = function(path) {
		var rv = _streams.readString($shell.getInstallation().getPlatformLoader(path).getReader());
		return rv;
	}

	var toScope = function(object) {
		if ($engine.toScope) return $engine.toScope(object);
		return object;
	}
	
	var $loader = {
		getLoaderCode: getLoaderCode
	};

	return $engine.script(
		"rhino/nashorn.js",
		getLoaderCode("rhino/nashorn.js"),
		toScope({ $loader: $loader, $engine: $engine }),
		null
	);
})();

$engine.$javaloader = $javaloader;

