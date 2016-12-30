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

		this.getCoffeeScript = function() {
			return $loader.getCoffeeScript();
		}

		this.script = function(name,code,scope,target) {
			//	TODO	revisit whether some improved error reporting code inspired by the below can be re-enabled at some point;
			//			currently it somehow breaks some automated tests
//			try {
				return $rhino.script(name,code,scope,target);
//			} catch (e) {
//				if (e.rhinoException) {
//					if (e.rhinoException.getWrappedException) {
//						if (e.rhinoException.getWrappedException().getErrors) {
//							var errors = e.rhinoException.getWrappedException().getErrors();
//							for (var i=0; i<errors.length; i++) {
//								Packages.java.lang.System.err.println(errors[i]);
//							}
//						} else {
//							e.rhinoException.getWrappedException().printStackTrace();
//						}
//					} else {
//						e.rhinoException.printStackTrace();
//					}
//				} else if (e.javaException) {
//					e.javaException.printStackTrace();
//				}
//				throw e;
//			}
		};

		this.getClasspath = function() {
			return $rhino.getClasspath();
		};
	};

	var $bridge = new function() {
		var getJavaClassName = function(javaclass) {
			var toString = "" + javaclass;
			if (/\[JavaClass /.test(toString)) {
				return toString.substring("[JavaClass ".length, toString.length-1);
			} else {
				return null;
			}
		}

		var getNamedJavaClass = function(name) {
			//	TODO	could this be $rhino.getClasspath().getClass(name) ?
			return Packages.org.mozilla.javascript.Context.getCurrentContext().getApplicationClassLoader().loadClass(name);
		};

		this.getJavaClass = function(name) {
			return Packages[name];
		}

		this.toNativeClass = function(javaclass) {
			var className = getJavaClassName(javaclass);
			if (className == null) throw new TypeError("Not a class: " + javaclass);
			return getNamedJavaClass(className);
		};

		this.isNativeJavaObject = function(object) {
			return String(object.getClass) == "function getClass() {/*\njava.lang.Class getClass()\n*/}\n";
		};

		this.test = {};
	};

	var rv = $rhino.script("rhino/literal.js", $loader.getLoaderCode("rhino/literal.js"), { $javahost: $javahost, $bridge: $bridge }, null);

	rv.getDebugger = function() {
		return $rhino.getDebugger();
	};

	return rv;
})()