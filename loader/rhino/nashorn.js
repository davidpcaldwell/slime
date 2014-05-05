(function() {
	var $javahost = new function() {
		this.getLoaderCode = function(path) {
			return $loader.getLoaderCode(path);
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

		this.script = function(name,code,scope,target) {
			return $engine.script(name,code,$engine.toScope(scope),target);
		};
	};
	
	var rv = $javahost.script("rhino/literal.js", $loader.getLoaderCode("rhino/literal.js"), $engine.toScope({ $javahost: $javahost }), null);
		
	rv.java = new function() {
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
	};
	
	return rv;
})()
