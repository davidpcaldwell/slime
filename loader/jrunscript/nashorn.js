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
	var toScope = function(scope) {
		var global = (function() { return this; })();
		// var rv = {};
		// for (var x in global) {
		// 	rv[x] = global[x];
		// }
		// rv.__proto__ = global
		// scope.__proto__ = global
		var rv = Object.create(global);
		for (var x in scope) {
			rv[x] = scope[x];
		}
		return rv;
	};

	var loaders = new function() {
		//	Attempt to use pure JavaScript to implement (ignoring name, which perhaps could be attached using a sourceURL-like
		//	hack)
		this.js = function(name,code,scope,target) {
			//	When executing jsh verification, this throws a mysterious NullPointerException deep inside Nashorn, which is hard to
			//	debug because of the wall of evals in the resulting stack trace
			return (function() {
				with(scope) {
					return eval(code + "//# sourceURL=" + name);
				}
			}).call(target);
		};

		//	Try to use public javax.script APIs with source rewriting; not very thought through and did not work in current form
		this.eval = function(name,code,scope,target) {
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
		}

		//	Attempt to leverage Nashorn/Graal shell APIs.
		this.load = function(name,code,scope,target) {
			if (!$graal) throw new Error("Would never work with current Nashorn design.");
			//	The "with" statement does not affect load(); load is always executed in global scope. See nashorn-dev thread
			//	"Scopes and load()": http://mail.openjdk.java.net/pipermail/nashorn-dev/2014-September/003372.html
			return (function() {
				with(scope) {
					return load({ name: name, script: code });
				}
			}).call(target);
		};
	}

	var nashorn = new function() {
		var Context = Java.type("jdk.nashorn.internal.runtime.Context");

		var toSource = function(name,code) {
			var Source = Java.type("jdk.nashorn.internal.runtime.Source");
			if (Source.sourceFor) return Source.sourceFor(name,code);
			return new Source(name,code);
		};

		//	Use Nashorn classes directly. Uses undocumented, non-public classes. Replaces 'old' implementation because 'old' relies
		//	on private meethods of undocumented classes. Should test whether this affects some of the "scope loss" bugs; however,
		//	those may have been caused by loading multiple scripts with the same name, so should also test that possibility.
		var compile = function(name,code,scope,target) {
			var compiled = Context.getContext().compileScript(toSource(name,code),scope);
			return Packages.jdk.nashorn.internal.runtime.ScriptRuntime.apply(compiled,target);
		};

		//	Initial working implementation, that nevertheless can fail in complicated scoping scenarios because sometimes scope
		//	chain is wrong. May be caused by incorrect use of private APIs, or perhaps by name collisions between multiple copies
		//	of the "same" script (script with same name) that could be solved by adding unambiguous names.
		var old = function(name,code,scope,target) {
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

		this.script = function(name,code,scope,target) {
			var notNull = function(o) {
				return (o) ? o : {};
			};
			var fixedScope = toScope(notNull(scope));
			var fixedTarget = notNull(target);
			var implementation = compile;
			if (!implementation) throw new Error("Unknown mode: " + implementation);
			return implementation(name,code,fixedScope,fixedTarget);
		}

		this.subshell = function(f) {
			var global = (function() { return this; })();
			var subglobal = Context.getContext().createGlobal();
			Context.setGlobal(subglobal);
			try {
				return f.apply(this,arguments);
			} finally {
				Context.setGlobal(global);
			}
		};

		this.sync = sync;
	};

	var graal = new function() {
		//	Creating new context does not work; results in complaints about cross-context access:
		//	var _context = Packages.org.graalvm.polyglot.Context.newBuilder("js").allowHostAccess(true).option("js.nashorn-compat","true").build();

		//	Getting bindings and using getMember/putMember in script code does not appear to work; failed with some kind of foreign INVOKE error; could retest

		//	Source transform apparently is needed to implement scope because otherwise, since we are re-using a single context,
		//	entering a new script overwrites/changes the bindings, so we also pass scope as function arguments

		//	Source transform is needed to implement 'this' targeting, as in Rhino; no straightforward way to change target as of
		//	now. Could use a magic Value member (see comment with 'script' below) but since we have to use a source transform
		//	anyway (see scope comment above), no real benefit to doing that right now.
		var context = function(name,code,scope,target) {
			var bindings = [];
			// TODO: No idea why this does not work if this value is true; that implementation seems cleaner and would love to
			// switch to it
			var USE_BINDINGS_FOR_CREATING_SCOPE = false;
			for (var x in scope) {
				if (x != "$$this") {
					bindings.push({ name: x, value: scope[x] });
				}
			}
			var args = bindings.map(function(binding) {
				return binding.name;
			}).join(",");
			code = "(function(" + args + ") { " + code + "}).call($$this," + args + ")";
			var _context = Packages.org.graalvm.polyglot.Context.getCurrent();
			var was = {};
			if (USE_BINDINGS_FOR_CREATING_SCOPE) {
				bindings.forEach(function(binding) {
					was[x] = $graal.getMember(binding.name);
					$graal.putMember(binding.name, binding.value);
				})
			} else {
				for (var x in scope) {
					was[x] = $graal.getMember(x);
					$graal.putMember(x, scope[x]);
				}
			}
			$graal.putMember("$$this", target);
			var _source = Packages.org.graalvm.polyglot.Source.newBuilder("js", code, name).build();
			var rv = _context.eval(_source);
			if (USE_BINDINGS_FOR_CREATING_SCOPE) {
				bindings.forEach(function(binding) {
					$graal.putMember(binding.name, was[binding.name]);
				});
			} else {
				for (var x in scope) {
					$graal.putMember(x, was[x]);
				}
			}
			$graal.putMember("$$this", null);
			return rv;
		};

		this.eval = function(name,code,scope,target) {
			var implementation = loaders.js;
			return implementation(name,code,scope,target);
		};

		this.script = function(name,code,scope,target) {
			// TODO: another approach to try: create a function, set it as a magic member on the Value, then invoke that member
			// using invokeMember on the value. May need to use new Function
			// to parse it, perhaps may still need to use scope arguments, or scope bindings
			var implementation = loaders.js;
			// var implementation = function(name,code,scope,target) {
			// 	return $graal.run(name,code,scope,target);
			// }
			if (name == "slime://loader/jrunscript/expression.js") implementation = loaders.js;
			if (name == "slime://loader/jrunscript/nashorn.js") implementation = loaders.js;
			if (name == "slime://loader/$api.js") implementation = loaders.js;
			var rv = implementation(name,code,scope,target);
			if (implementation == loaders.js) {
				//Packages.java.lang.System.err.println("evaluated " + name + ": " + rv);
			}
			return rv;
		}

		this.subshell = function(f) {
			throw new Error("Graal subshell not implemented.");
		};
	};

	var engine = ($graal) ? graal : nashorn;
	if (typeof($classpath) == "undefined") {
		return engine;
	} else {
		var $getLoaderCode = function(path) {
			return $loader.getLoaderCode(path);
		};
	
		var $getCoffeeScript = function() {
			return $loader.getCoffeeScript();
		};
	
		var $javahost = new function() {
			this.getLoaderCode = $getLoaderCode;

			this.getCoffeeScript = function() {
				return $getCoffeeScript();
			};

			this.getClasspath = function() {
				return $classpath;
			};

			this.eval = function(name,code,scope,target) {
				if (engine.eval) {
					return engine.eval(name,code,toScope(scope),target);
				} else {
					return engine.script(name,code,toScope(scope),target);
				}
			}

			this.script = function(name,code,scope,target) {
				return engine.script(name,code,toScope(scope),target);
			};

			//	TODO	setReadOnly?
			//	TODO	MetaObject?
		};

		var $bridge = new function() {
			var javaLangObjectArrayClass;
			var javaLangClassNativeClass = $classpath.getClass("java.lang.Class");

			var isJavaObjectArray = function(v) {
				//	TODO	In Nashorn, this could be: Java.type("java.lang.Object[]").class;
				if (!javaLangObjectArrayClass) javaLangObjectArrayClass = Java.type("java.lang.Object[]").class;
				return javaLangObjectArrayClass.isInstance(v);
			};

			this.getJavaClass = function(name) {
				return Java.type(name);
			};

			this.toNativeClass = function(javaclass) {
				if ($graal) return javaclass.class;
				if (javaLangClassNativeClass.isInstance(javaclass)) return javaclass;
				return javaclass.class;
			};

			this.isNativeJavaObject = function(object) {
				if (isJavaObjectArray(object)) return true;
				return typeof(object.getClass) == "function" && object.getClass() == Java.type(object.getClass().getName()).class;
			};
		}

		var rv = $javahost.script("slime://loader/jrunscript/expression.js", $getLoaderCode("jrunscript/expression.js"), toScope({ $javahost: $javahost, $bridge: $bridge }), null);

		if (engine.sync) {
			rv.java.sync = sync;
		}

		if (engine.sync) {
			rv.java.thisSynchronize = function(f) {
				return sync(f);
			};
		}

		return rv;
	}
})()