//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.host.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.host.Exports } $exports
	 */
	function(Packages,JavaAdapter,$api,$context,$loader,$exports) {
		$exports.getClass = $context.$slime.java.getClass;

		var isJavaObject = $context.$slime.java.isJavaObject;
		$exports.isJavaObject = isJavaObject;

		$exports.isJavaType = $context.$slime.java.isJavaType;

		$exports.toNativeClass = $context.$slime.java.toNativeClass;

		$exports.vm = {
			properties: (
				function() {
					/** @type { (_value: any) => slime.$api.fp.Maybe<string> } */
					var getPropertyJavascriptValue = function(_value) {
						if (typeof(_value) != "string" && !$exports.isJavaType(Packages.java.lang.String)(_value)) {
							//	omit

							//	TODO	we seem to still have inonit.script.jsh.Main.stdout, .stderr, and .stdin in this category,
							//			though code searches have not yet revealed exactly how they are created. Perhaps by
							//			Main.class.getName() + ".stdout" etc.
							//rv[String(_next)] = "NOT STRING: " + String(_value);
							return $api.fp.Maybe.from.nothing();
						} else {
							return $api.fp.Maybe.from.some(String(_value));
						}
					}

					var _properties = Packages.java.lang.System.getProperties();

					return {
						all: function() {
							var _keys = _properties.keySet().iterator();
							/** @type { ReturnType<slime.jrunscript.host.Exports["vm"]["properties"]["all"]> } */
							var rv = {};
							while(_keys.hasNext()) {
								var _next = _keys.next();
								var _value = _properties.getProperty(_next);
								var maybe = getPropertyJavascriptValue(_value);
								if (!maybe.present) {
									//	omit

									//	TODO	we seem to still have inonit.script.jsh.Main.stdout, .stderr, and .stdin in this category,
									//			though code searches have not yet revealed exactly how they are created. Perhaps by
									//			Main.class.getName() + ".stdout" etc.
									//rv[String(_next)] = "NOT STRING: " + String(_value);
								} else {
									rv[String(_next)] = maybe.value;
								}
							}
							return rv;
						},
						value: function(name) {
							return function() {
								var _value = _properties.getProperty(name);
								var maybe = getPropertyJavascriptValue(_value);
								return maybe;
							}
						}
					}
				}
			)()
		}

		var JavaArray = new function() {
			this.create = function(p) {
				var type = (p.type) ? p.type : Packages.java.lang.Object;
				var rv = Packages.java.lang.reflect.Array.newInstance($context.$slime.java.toNativeClass(type),p.array.length);
				for (var i=0; i<p.array.length; i++) {
					rv[i] = p.array[i];
				}
				return rv;
			};

			this.adapt = function(_p) {
				//	TODO	probably can be done with Array.prototype.slice()
				if (typeof(_p.length) == "number") {
					var rv = [];
					for (var i=0; i<_p.length; i++) {
						rv[i] = _p[i];
					}
					return rv;
				} else if (typeof(_p.size) == "function") {
					var rv = [];
					for (var i=0; i<_p.size(); i++) {
						rv[i] = _p.get(i);
					}
					return rv;
				} else {
					throw new Error("Unsupported type for Array.adapt");
				}
			}
		};

		$exports.Array = JavaArray;

		$exports.Map = function(o) {
			return $api.fp.result(
				o.object,
				Object.entries,
				function(entries) {
					return entries.reduce(function(rv,entry) {
						rv.put(entry[0],entry[1]);
						return rv;
					}, new Packages.java.util.HashMap())
				}
			)
		}

		$exports.invoke = function(p) {
			var parameterTypes = (p.method.parameterTypes) ? p.method.parameterTypes : [];
			var _types = JavaArray.create({
				type: Packages.java.lang.Class,
				//	TODO	would be better to use Packages.xxx rather than names
				array: parameterTypes.map($context.$slime.java.toNativeClass)
			});
			var _class = (p.method.class) ? $context.$slime.java.toNativeClass(p.method.class) : p.target.getClass();
			var _method = _class.getDeclaredMethod(p.method.name, _types);
			_method.setAccessible(true);
			var rv = _method.invoke(
				(p.target) ? p.target : null,
				JavaArray.create({
					type: Packages.java.lang.Object,
					array: (p.arguments) ? p.arguments : []
				})
			);
			if (_method.getReturnType() == Packages.java.lang.Void.TYPE) return void(0);
			return rv;
		};

		var PropertyParent = function() {
		}
		PropertyParent.prototype.toString = function() {
			return null;
		};
		$exports.Properties = function($properties) {
			var nashornTrace = function(s) {
				//Packages.java.lang.System.err.println(s);
			}
			nashornTrace("Properties constructor");
			var rv = {};
			var keys = $properties.propertyNames();
			while(keys.hasMoreElements()) {
				nashornTrace("key");
				var name = String(keys.nextElement());
				var value = String($properties.getProperty(name));
				nashornTrace(name + "=" + value);
				var tokens = name.split(".");
				var target = rv;
				for (var i=0; i<tokens.length-1; i++) {
					if (!target[tokens[i]]) {
						nashornTrace("token: " + tokens[i] + " is PropertyParent");
						target[tokens[i]] = new PropertyParent();
					} else if (typeof(target[tokens[i]]) == "string") {
						nashornTrace("token: " + tokens[i] + " is currently string; replacing with PropertyParent");
						var toString = (function(value) {
							return function() {
								return value;
							}
						})(target[tokens[i]]);
						target[tokens[i]] = new PropertyParent();
						target[tokens[i]].toString = toString;
					} else {
						nashornTrace("target: " + tokens[i] + " found.");
					}
					target = target[tokens[i]];
				}
				if (!target[tokens[tokens.length-1]]) {
					nashornTrace("Last token: " + tokens[tokens.length-1] + " is string");
					target[tokens[tokens.length-1]] = value;
				} else {
					nashornTrace("Last token: " + tokens[tokens.length-1] + " is toString");
					target[tokens[tokens.length-1]].toString = (function(constant) {
						return function() {
							return constant;
						}
					})(value);
				}
			}
			nashornTrace("Properties constructor returning");
			return rv;
		};
		$api.experimental($exports,"Properties");
		$exports.Properties.adapt = function($properties) {
			return new $exports.Properties($properties);
		}

		var errors = new function() {
			var instance = (function _Throwables() {
				return new Packages.inonit.script.runtime.Throwables();
			})();

			this.decorate = function(implementation) {
				var rv = function() {
					//	TODO	what if called as function?
					var literals = Array.prototype.map.call(arguments,function(a,i) {
						return "arguments["+i+"]";
					}).join(",");
					//	TODO	is this parameterized call already in js/object?
					var created = eval("new implementation(" + literals + ")");

					if (!created.stack) {
						var tracer;
						try {
							instance.throwException(created.toString());
						} catch (e) {
							tracer = e;
						}
						var t = tracer.rhinoException;
						var stack = [];
						while(t != null) {
							var sw = new Packages.java.io.StringWriter();
							var pw = new Packages.java.io.PrintWriter(sw);
							if (t == tracer.rhinoException) {
								sw.write(t.getScriptStackTrace());
							} else {
								t.printStackTrace(pw);
							}
							pw.flush();
							var tstack = String(sw.toString()).split(String(Packages.java.lang.System.getProperty("line.separator")));
							if (t == tracer.rhinoException) {
								tstack = tstack.slice(1,tstack.length);
							}
							for (var i=0; i<tstack.length; i++) {
								if (/^Caused by\:/.test(tstack[i])) {
									break;
								}
								stack.push(tstack[i]);
							}
							t = t.getCause();
							if (t != null && String(t.getClass().getName()) == "inonit.script.runtime.Throwables$Exception") {
								t = null;
							}
						}
						//	TODO	clean up the first line, eliminating all the wrapping in WrappedException and Throwables.Exception
						//	TODO	clean up the top of the trace, removing the irrelevant Java lines and the first script line corresponding
						//			to this file
						//	TODO	get full stack traces if possible, rather than the limited version being provided now (which has ...more)
						//			however, could be impossible (getStackTrace may not be overridden while printStackTrace is).
						created.stack = stack.join("\n");
					}
					return created;
				}
				rv.prototype = implementation.prototype;
				return rv;
			};
		}

		//	TODO	The below probably only needs to execute under Rhino, but need to figure out how to do that. For now it is effectively
		//			disabled for Nashorn by checking for existence of stack property in errors.decorate
		if ($context.globals) {
			var global = (function() {
				var rv = this;
				while(rv.__parent__) {
					rv = rv.__parent__;
				}
				return rv;
			})();

			var errorNames = (function() {
				if (false) {
					//	Does not work; these properties are not enumerable, apparently
					var rv = [];
					for (var x in global) {
						if (global[x].prototype.__proto__ == global[x].prototype) {
							rv.push(x);
						}
					}
					return rv;
				} else {
					//	TODO	What is ConversionError? Does not seem to appear in the ECMA standard; is it a Rhino thing?
					//	TODO	What is InternalError? Does not seem to appear in the ECMA standard; is it a Rhino thing?
					return [
						"Error","ConversionError","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError"
						,"URIError"
					];
				}
			})();

			errorNames.forEach( function(name) {
				if (!global[name]) {
					//	Probably just not defined in this engine
					//	TODO	log message or synthesize error or something
				} else {
					global[name] = errors.decorate(global[name]);
				}
			});
		}

		var createErrorType = function(p) {
			var f = function(message) {
				this.message = message;
				this.name = p.name;
			};
			f.prototype = new Error();
			var rv = errors.decorate(rv);
			return rv;
		}
		$exports.ErrorType = createErrorType;
		$api.experimental($exports,"ErrorType");

		// var experimental = function(name) {
		// 	$exports[name] = items[name];
		// 	$api.experimental($exports, name);
		// };

		var toJsArray = function(javaArray,scriptValueFactory) {
			if (typeof(javaArray) == "undefined" || javaArray == null) throw "Required: the Java array must not be null or undefined.";
			if (typeof(scriptValueFactory) == "undefined" || scriptValueFactory == null)
				throw "Required: the function to convert Java objects to ECMAScript objects must not be null or undefined.";
			var rv = new Array(javaArray.length);
			for (var i=0; i<javaArray.length; i++) {
				rv[i] = scriptValueFactory(javaArray[i]);
			}
			return rv;
		}
		$exports.toJsArray = $api.deprecate(toJsArray);

		//	TODO	at least implement this in terms of $exports.Array.create
		var toJavaArray = function(jsArray,javaclass,adapter) {
			if (!adapter) adapter = function(x) { return x; }
			var rv = Packages.java.lang.reflect.Array.newInstance($context.$slime.java.toNativeClass(javaclass),jsArray.length);
			for (var i=0; i<jsArray.length; i++) {
				rv[i] = adapter(jsArray[i]);
			}
			return rv;
		};
		$exports.toJavaArray = $api.deprecate(toJavaArray);

		// if ($context.globals && $context.globals.Array) {
		// 	Array.java = {};
		// 	deprecate(Array, "java");
		// 	//	TODO	Review whether having the second argument be required makes sense
		// 	Array.java.toScript = items.toJsArray;

		// 	Array.prototype.toJava = $api.deprecate(function(javaclass) {
		// 		return toJavaArray(this,javaclass);
		// 	});
		// }

		//	TODO	Below seems to be some kind of elaborate error-handling attempt; it merits examination at some point
		//var execute = function(pathname) {
		//	try {
		//		jsh.execute(scope,pathname);
		//	} catch (e) {
		//		scope.$jsunit.success = false;
		//		var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
		//		var errors = Packages.inonit.script.rhino.Engine.Errors.get(context);
		//		var array = errors.getErrors();
		//		var printedSomething = false;
		//		for (var i=0; i<array.length; i++) {
		//			var boilerplate = function(error) {
		//				if (String(error.getMessage()).indexOf("Compilation produced") == 0) {
		//					return true;
		//				}
		//				return false;
		//			}
		//			var error = array[i];
		//			if (!boilerplate(error)) {
		//				Packages.java.lang.System.err.println(
		//					error.getSourceName()
		//					+ ":" + error.getLineNumber()
		//					+ ": " + error.getMessage()
		//					+ "\n" + error.getLineSource()
		//				);
		//				printedSomething = true;
		//			}
		//		}
		//		if (!printedSomething) {
		//			Packages.java.lang.System.err.println(e);
		//			for (var x in e) {
		//				Packages.java.lang.System.err.println("e[" + x + "] = " + e[x]);
		//			}
		//		}
		//		throw "Compilation errors in " + pathname;
		//	}
		//}

		$exports.log = $loader.file("logging.java.js", {
			prefix: $context.logging.prefix,
			api: {
				java: {
					Array: JavaArray
				}
			}
		}).log;

		/**
		 * @type { (java: slime.jrunscript.runtime.Exports["java"]) => java is slime.jrunscript.runtime.MultithreadedJava }
		 */
		var isMultithreaded = function(java) {
			return Boolean(java["sync"]);
		};

		var java = $context.$slime.java;

		if (isMultithreaded(java)) {
			$exports.Thread = $loader.module("threads.js", {
				java: java,
				log: $exports.log.named("jrunscript.host"),
				classpath: $context.$slime.classpath
			});
		}

		$exports.Environment = function(_environment) {
			/** @type { ReturnType<slime.jrunscript.host.Exports["Environment"] >} */
			var rv = {};
			var i = _environment.getMap().keySet().iterator();
			while(i.hasNext()) {
				var name = String(i.next());
				var value = String(_environment.getValue(name));
				Object.defineProperty(rv, name, { value: value, enumerable: true, configurable: true });
				//	The below handling of case sensitivity deals with GraalVM unwrapping java.lang.Boolean to JavaScript boolean,
				//	while Nashorn and Rhino do not (untested, but the code below should have broken if not?)
				var isCaseSensitiveObject;
				if (typeof(_environment.isNameCaseSensitive()) == "boolean") {
					isCaseSensitiveObject = (function toObject(value) {
						return { booleanValue: function() { return value; } }
					})(_environment.isNameCaseSensitive())
				} else {
					isCaseSensitiveObject = _environment.isNameCaseSensitive()
				}
				if (isCaseSensitiveObject && !isCaseSensitiveObject.booleanValue() && !rv[name.toUpperCase()]) {
					Object.defineProperty(rv, name.toUpperCase(), { value: value, enumerable: false });
				}
			}
			return rv;
		};

		$exports.addShutdownHook = function(f) {
			Packages.java.lang.Runtime.getRuntime().addShutdownHook(new Packages.java.lang.Thread(
				new JavaAdapter(
					Packages.java.lang.Runnable,
					{
						run: f
					}
				)
			));
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$loader,$exports)
