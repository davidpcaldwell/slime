//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the rhino/host SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	replace 'warning' with standard tools like $api.deprecate
var warning = ($context.warning) ? $context.warning : function(s) {
	debugger;
	Packages.java.lang.System.err.println("rhino/host WARNING: " + s);
};

var items = $loader.file("java.js", {
	//	TODO	replace 'warning' with standard tools like $api.deprecate
	warning: (function() {
		if ($context.warning) return $context.warning;
		return function(message) {
			debugger;
			Packages.java.lang.System.err.println(message);
		}
	})()
});
$exports.isJavaObject = items.isJavaObject;
$exports.toJsArray = items.toJsArray;

$exports.Properties = function($properties) {
	return Packages.inonit.script.runtime.Properties.create($properties);
}
$api.experimental($exports,"Properties");
$exports.Properties.adapt = function($properties) {
	return new $exports.Properties($properties);
}

var errors = new function() {
	var instance = new Packages.inonit.script.runtime.Throwables();

	this.fail = function(message) {
		instance.fail(message);
	}

	this.decorate = function(implementation) {
		var prototype = implementation.prototype;
		var rv = function() {
			//	TODO	what if called as function?
			var literals = Array.prototype.map.call(arguments,function(a,i) {
				return "arguments["+i+"]";
			}).join(",");
			//	TODO	is this parameterized call already in js/object?
			var created = eval("new implementation(" + literals + ")");

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
			created.stack = stack;
			return created;
		}
		rv.prototype = prototype;
		return rv;
	};
}

$exports.fail = function(message) {
	errors.fail(message);
};
$api.experimental($exports,"fail");

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
			return [
				"Error","ConversionError","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError"
				,"URIError"
			];
		}
	})();

	errorNames.forEach( function(name) {
		global[name] = errors.decorate(global[name]);
	});
}

var createErrorType = function(p) {
	var rv = function(message) {
		this.message = message;
		this.name = p.name;
	};
	rv.prototype = new Error();
	rv = errors.decorate(rv);
	return rv;
}
$exports.ErrorType = createErrorType;
$api.experimental($exports,"ErrorType");

var experimental = function(name) {
	$exports[name] = items[name];
	$api.experimental($exports, name);
}

var getJavaClassName = function(javaclass) {
	var toString = "" + javaclass;
	if (/\[JavaClass /.test(toString)) {
		return toString.substring("[JavaClass ".length, toString.length-1);
	} else {
		return null;
	}
}

var $isJavaType = function(javaclass,object) {
	var getNamedJavaClass = function(name) {
		return Packages.org.mozilla.javascript.Context.getCurrentContext().getApplicationClassLoader().loadClass(name);
	};

	var className = getJavaClassName(javaclass);
	if (className == null) throw "Not a class: " + javaclass;
	if (!items.isJavaObject(object)) return false;
	var loaded = getNamedJavaClass(className);
	return loaded.isInstance(object);
}
$exports.isJavaType = function(javaclass) {
	if (arguments.length == 2) {
		warning("WARNING: Use of deprecated 2-argument form of isJavaType.");
		return $isJavaType(javaclass,arguments[1]);
	}
	return function(object) {
		return $isJavaType(javaclass,object);
	}
};
$api.experimental($exports,"isJavaType");
experimental("toJavaArray");

$exports.Thread = function(f) {
	var runnable = new function() {
		var _callbacks;

		this.initialize = function(callbacks) {
			_callbacks = callbacks;
		}

		this.run = function() {
			try {
				var rv = f();
				if (_callbacks && _callbacks.returned) {
					_callbacks.returned(rv);
				}
			} catch (e) {
				if (_callbacks && _callbacks.threw) {
					_callbacks.threw(e);
				}
			}
		}
	}


	var thread = new Packages.java.lang.Thread(new JavaAdapter(Packages.java.lang.Runnable,runnable));

	this.start = function(callbacks) {
		runnable.initialize(callbacks);
		thread.start();
	}

	this.join = function() {
		thread.join();
	}
};
$exports.Thread.thisSynchronize = function(f) {
	//	TODO	deprecate when Rhino 1.7R3 released; use two-argument version of the Synchronizer constructor in a new method called
	//			synchronize()
	return new Packages.org.mozilla.javascript.Synchronizer(f);
};