//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/host SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
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
	if (className == null) throw new TypeError("Not a class: " + javaclass);
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

var Thread = function(p) {
	var synchronize = function(f) {
		return Packages.inonit.script.runtime.Threads.synchronizeOn(arguments.callee.lock,f);
	};
	synchronize.lock = new Packages.java.lang.Object();

	var done = false;

	var debug = function(m) {
		if (arguments.callee.on) {
			Packages.java.lang.System.err.println(m);
		}
	}

	var runnable = new function() {
		this.run = function() {
			try {
				var rv = p.call();
				if (!done) {
					synchronize(function() {
						if (p.on && p.on.result) {
							p.on.result(rv);
						}
						debug("Returned: " + thread);
						done = true;
						synchronize.lock.notifyAll();
					})();
				}
			} catch (e) {
				var error = e;
				if (!done) {
					synchronize(function() {
						if (p.on && p.on.error) {
							p.on.error(error);
						}
						debug("Threw: " + thread);
						done = true;
						synchronize.lock.notifyAll();
					})();
				}
			}
		}
	}


	var thread = new Packages.java.lang.Thread(new JavaAdapter(Packages.java.lang.Runnable,runnable));

	thread.start();

	if (p && p.timeout) {
		debug("Starting timeout thread for " + thread + " ...");
		new arguments.callee({
			call: function() {
				debug(thread + ": Sleeping for " + p.timeout);
				Packages.java.lang.Thread.sleep(p.timeout);
				debug(thread + ": Waking from sleeping for " + p.timeout);
				if (!done) {
					synchronize(function() {
						if (p.on && p.on.timeout) {
							p.on.timeout();
						}
						debug("Timed out: " + thread);
						done = true;
						synchronize.lock.notifyAll();
					})();
				}
			}
		});
	}

	this.join = function() {
		synchronize(function() {
			debug("Waiting for " + thread);
			while(!done) {
				debug("prewait done = " + done + " for " + thread);
				synchronize.lock.wait();
				debug("postwait done = " + done + " for " + thread);
			}
		})();
		debug("Done waiting for " + thread);
	};
};
$exports.Thread = {};
$exports.Thread.start = function(p) {
	return new Thread(p);
}
$exports.Thread.run = function(p) {
	var callee = arguments.callee;
	var on = new function() {
		var result = {};

		this.result = function(rv) {
			result.returned = { value: rv };
		}

		this.error = function(t) {
			result.threw = t;
		}

		this.timeout = function() {
			result.timedOut = true;
		}

		this.evaluate = function() {
			if (result.returned) return result.returned.value;
			if (result.threw) throw result.threw;
			if (result.timedOut) throw callee.TIMED_OUT;
		}
	};
	var o = {};
	for (var x in p) {
		o[x] = p[x];
	}
	o.on = on;
	var t = new Thread(o);
	t.join();
	return on.evaluate();
};
//	TODO	make the below a subtype of Error
//	TODO	this indirection is necessary because Rhino debugger pauses when constructing new Error() if set to break on errors
$exports.Thread.run.__defineGetter__("TIMED_OUT", function() {
	if (!arguments.callee.cached) {
		arguments.callee.cached = new Error("Timed out.");
	}
	return arguments.callee.cached;
});
$exports.Thread.thisSynchronize = function(f) {
	//	TODO	deprecate when Rhino 1.7R3 released; use two-argument version of the Synchronizer constructor in a new method called
	//			synchronize()
	return new Packages.org.mozilla.javascript.Synchronizer(f);
};
$exports.Thread.Monitor = function() {
	var lock = new Packages.java.lang.Object();

	this.Waiter = function(c) {
		return Packages.inonit.script.runtime.Threads.synchronizeOn(lock, function() {
			while(!c.until.apply(this,arguments)) {
				lock.wait();
			}
			var rv = c.then.apply(this,arguments);
			lock.notifyAll();
			return rv;
		});
	}
}

$exports.environment = (function() {
	var getter = function(value) {
		return function() {
			return value;
		};
	};

	var isCaseInsensitive = (function() {
		var jenv = Packages.java.lang.System.getenv();
		var i = jenv.keySet().iterator();
		while(i.hasNext()) {
			var name = String(i.next());
			var value = String(jenv.get(name));
			if (name != name.toUpperCase()) {
				return String(Packages.java.lang.System.getenv(name.toUpperCase())) == value;
			}
		}
		return function(){}();
	})();

	var jenv = ($context._environment) ? $context._environment : Packages.java.lang.System.getenv();
	var rv = {};
	var i = jenv.keySet().iterator();
	while(i.hasNext()) {
		var name = String(i.next());
		var value = String(jenv.get(name));
		if (isCaseInsensitive) {
			name = name.toUpperCase();
		}
		rv.__defineGetter__(name, getter(value));
	}
	return rv;
})();

//	TODO	Document $context._properties
var _properties = ($context._properties) ? $context._properties : Packages.java.lang.System.getProperties();
$exports.properties = $exports.Properties.adapt(_properties);
$api.experimental($exports,"properties");
