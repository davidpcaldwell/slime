(function() {
	var $javahost = new function() {
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

		this.getLoaderCode = function(path) {
			return $loader.getLoaderCode(path);
		}

		this.script = function(name,code,scope,target) {
			return $rhino.script(name,code,scope,target);
		};

		this.getClasspath = function() {
			return $rhino.getClasspath();
		};
	};

	var rv = $rhino.script("rhino/literal.js", $loader.getLoaderCode("rhino/literal.js"), { $javahost: $javahost }, null);
	
	rv.java = new function() {
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
	};
	
	rv.getDebugger = function() {
		return $rhino.getDebugger();
	};
	
	return rv;
})()
