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
	
	this.jsh = function(configuration,invocation) {
		var subshell = Packages.inonit.script.jsh.Shell.create(
			$shell.getInstallation(),
			configuration,
			invocation
		);
		throw new Error("Unimplemented: Nashorn subshell.");
//		Integer rv = Rhino.execute(subshell, this.rhino, subinterface());
//		debugger.setBreakOnExceptions(breakOnExceptions);
//		if (rv == null) return 0;
//		return rv.intValue();		
	}
}