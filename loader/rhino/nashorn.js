//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

load("nashorn:mozilla_compat.js");

(function() {
	var hasNashornErrorHack = (function() {
		if (Packages.java.lang.System.getenv("DISABLE_NASHORN_ERROR_HACK")) return false;
		this.Error = function(message) {
			this.name = "Error";
			this.message = message;
			this.stack = (function() {
				var frames = new Packages.java.lang.Throwable().getStackTrace();
				var rv = "";
				for (var i=2; i<frames.length; i++) {
					if (frames[i].getFileName() && !/\.java$/.test(frames[i].getFileName())) {
						rv += "\tat " + frames[i].getFileName() + ":" + frames[i].getLineNumber() + "\n";
					}
				}
				return rv;
			})();
			var _jlogging = Packages.java.util.logging;
			_jlogging.Logger.getLogger("inonit.script.nashorn.Host.script").log(_jlogging.Level.INFO, this.message);
			_jlogging.Logger.getLogger("inonit.script.nashorn.Host.script").log(_jlogging.Level.INFO, this.stack);
		};
		this.Error.prototype.toString = function() {
			return this.name + ": " + this.message;
		};

		var Subtype = function(Error,name) {
			var rv = function() {
				Error.apply(this,arguments);
				this.name = name;
			};
			rv.prototype = new Error();
			return rv;
		};
		this.TypeError = new Subtype(this.Error,"TypeError");
		return true;
	})();

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
		} else if (false) {
			scope.__proto__ = global;
			return scope;
		} else {
			var rv = Object.create(global);
			for (var x in scope) {
				rv[x] = scope[x];
			}
			return rv;
		}
	};

	var Context = Java.type("jdk.nashorn.internal.runtime.Context");

	var loaders = new function() {
		var toSource = function(name,code) {
			var Source = Java.type("jdk.nashorn.internal.runtime.Source");
			if (Source.sourceFor) return Source.sourceFor(name,code);
			return new Source(name,code);
		};

		//	Attempt to use pure JavaScript to implement (ignoring name, which perhaps could be attached using a sourceURL-like
		//	hack)
		this.js = function(name,code,scope,target) {
			//	When executing jsh verification, this throws a mysterious NullPointerException deep inside Nashorn, which is hard to
			//	debug because of the wall of evals in the resulting stack trace
			return (function() {
				with(scope) {
					return eval(code);
				}
			}).call(target);
		};

		//	Try to use public javax.script APIs with source rewriting; not very thought through and did not work in current form
		this.eval = function(name,code,scope,target) {
			throw new Error("Unimplemented.");
			//	$interface was nested class of inonit.script.nashorn.Host:
			//	public class Interface {
			//		public Object eval(String name, String code, Bindings bindings) throws ScriptException {
			//			ScriptContext c = engine.getContext();
			//			c.setAttribute(ScriptEngine.FILENAME, name, ScriptContext.ENGINE_SCOPE);
			//			return engine.eval(code, bindings);
			//		}
			//	}
			//	exposed by:
			//	factory.getBindings().put("$interface", new Interface());
			//	in constructor

			var targeted = "(function() { return (" + code + ");\n}).call($$this)";
			var _bindings = new Packages.javax.script.SimpleBindings();
			for (var x in scope) {
				_bindings.put(x,scope[x]);
			}
			_bindings.put("$$this",target);
			return $interface.eval(name, targeted, _bindings);
		};

		//	Use Nashorn classes directly. Uses undocumented, non-public classes. Replaces 'old' implementation because 'old' relies
		//	on private meethods of undocumented classes. Should test whether this affects some of the "scope loss" bugs; however,
		//	those may have been caused by loading multiple scripts with the same name, so should also test that possibility.
		this.compile = function(name,code,scope,target) {
			var compiled = Context.getContext().compileScript(toSource(name,code),scope);
			return Packages.jdk.nashorn.internal.runtime.ScriptRuntime.apply(compiled,target);
		};

		//	Initial working implementation, that nevertheless can fail in complicated scoping scenarios because sometimes scope
		//	chain is wrong. May be caused by incorrect use of private APIs, or perhaps by name collisions between multiple copies
		//	of the "same" script (script with same name) that could be solved by adding unambiguous names.
		this.old = function(name,code,scope,target) {
			if (!arguments.callee.evaluateSource) {
				var evaluateSourceSignature = new (Java.type("java.lang.Class[]"))(3);
				var ScriptObject = Java.type("jdk.nashorn.internal.runtime.ScriptObject");
				evaluateSourceSignature[0] = Java.type("jdk.nashorn.internal.runtime.Source").class;
				evaluateSourceSignature[1] = ScriptObject.class;
				evaluateSourceSignature[2] = ScriptObject.class;
				arguments.callee.evaluateSource = Context.class.getDeclaredMethod("evaluateSource", evaluateSourceSignature);
				arguments.callee.evaluateSource.setAccessible(true);
			}
			return arguments.callee.evaluateSource.invoke(Context.getContext(), toSource(name,code), scope, target);
		};

		//	Attempt to leverage Nashorn script APIs.
		this.load = function(name,code,scope,target) {
			throw new Error("Would never work with current Nashorn design.");
			//	The "with" statement does not affect load(); load is always executed in global scope. See nashorn-dev thread
			//	"Scopes and load()": http://mail.openjdk.java.net/pipermail/nashorn-dev/2014-September/003372.html
			return (function() {
				with(scope) {
					return load({ name: name, script: code });
				}
			}).call(target);
		};
	}

	var script = function(name,code,scope,target) {
		var notNull = function(o) {
			return (o) ? o : {};
		};
		var fixedScope = toScope(notNull(scope));
		var fixedTarget = notNull(target);
		var mode = Packages.java.lang.System.getenv("SLIME_LOADER_RHINO_NASHORN_SCRIPT");
		if (!mode) mode = "compile";
		var implementation = loaders[mode];
		if (!implementation) throw new Error("Unknown mode: " + mode);
		return implementation(name,code,fixedScope,fixedTarget);
	};

	if (typeof($classpath) == "undefined") {
		return {
			script: script,//(script) ? script : Java.type("java.lang.System").getProperties().get("slime/loader/rhino/nashorn.js:script"),
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

			this.getCoffeeScript = function() {
				return $getCoffeeScript();
			};

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

			this.test = {
				HAS_NASHORN_ERROR_HACK: hasNashornErrorHack
			}
		};

		return rv;
	}
})()