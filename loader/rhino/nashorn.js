load("nashorn:mozilla_compat.js");

(function() {
	var Context = Java.type("jdk.nashorn.internal.runtime.Context");
	var evaluateSourceSignature = new (Java.type("java.lang.Class[]"))(3);
	var Source = Java.type("jdk.nashorn.internal.runtime.Source");
	var ScriptObject = Java.type("jdk.nashorn.internal.runtime.ScriptObject");
	evaluateSourceSignature[0] = Source.class;
	evaluateSourceSignature[1] = ScriptObject.class;
	evaluateSourceSignature[2] = ScriptObject.class;
	var evaluateSource = Context.class.getDeclaredMethod("evaluateSource", evaluateSourceSignature);
	evaluateSource.setAccessible(true);

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
	};

	var script = function(name,code,scope,target) {
		var context = Context.getContext();
		var notNull = function(o) {
			return (o) ? o : {};
		}
		return evaluateSource.invoke(context, new Source(name,code), toScope(notNull(scope)), notNull(target));
	};
	
	if (typeof($classpath) == "undefined") {
		return {
			script: script,
			subshell: function(f) {
				var global = (function() { return this; })();
				var subglobal = Context.getContext().createGlobal();
				Context.setGlobal(subglobal);
				try {
					return f.apply(this,arguments);
				} finally {
					Context.setGlobal(global);
				}				
			}
		};
	} else {
		var $javahost = new function() {
			this.getLoaderCode = $getLoaderCode;

			this.getClasspath = function() {
				return $classpath;
			};

			this.script = function(name,code,scope,target) {
				return script(name,code,toScope(scope),target);
			};

			//	TODO	setReadOnly?
			//	TODO	MetaObject?
		};

		var rv = $javahost.script("rhino/literal.js", $getLoaderCode("rhino/literal.js"), toScope({ $javahost: $javahost }), null);

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
	}
})()
