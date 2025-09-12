//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.runtime.sync } sync
	 * @param { slime.jrunscript.runtime.internal.rhino.Scope["$rhino"] } $rhino
	 * @param { slime.jrunscript.runtime.internal.rhino.Scope["$loader"] } $loader
	 * @returns { slime.jrunscript.runtime.Rhino }
	 */
	function(Packages,sync,$rhino,$loader) {
		var $javahost = (
			/**
			 *
			 * @returns { slime.jrunscript.runtime.$javahost }
			 */
			function() {
				var MetaObject = function(p) {
					var delegate = (p.delegate) ? p.delegate : {};
					var get = (p.get) ? p.get : function(){};
					var set = (p.set) ? p.set : function(){};
					return Packages.inonit.script.rhino.MetaObject.create(delegate,get,set);
				};

				var script = function(name,code,scope,target) {
					//	TODO	revisit whether some improved error reporting code inspired by the below can be re-enabled at some point;
					//			currently it somehow breaks some automated tests
					// try {
						return $rhino.script(name,code,scope,target);
					// } catch (e) {
					// 	if (e.rhinoException) {
					// 		if (e.rhinoException.getWrappedException) {
					// 			if (e.rhinoException.getWrappedException().getErrors) {
					// 				var errors = e.rhinoException.getWrappedException().getErrors();
					// 				for (var i=0; i<errors.length; i++) {
					// 					Packages.java.lang.System.err.println(errors[i]);
					// 				}
					// 			} else {
					// 				e.rhinoException.getWrappedException().printStackTrace();
					// 			}
					// 		} else {
					// 			e.rhinoException.printStackTrace();
					// 		}
					// 	} else if (e.javaException) {
					// 		e.javaException.printStackTrace();
					// 	}
					// 	throw e;
					// }
				};

				var noEnvironmentAccess = !$rhino.canAccessEnvironment();

				return {
					debugger: $rhino.getDebugger(),
					script: script,
					eval: script,
					MetaObject: MetaObject,
					noEnvironmentAccess: noEnvironmentAccess
				}
			}
		)();

		//	TODO	do not use constructor-style creation
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
				//	TODO	this seems unacceptably brittle, but seems to work for now
				if (className == null) {
					try {
						if (getNamedJavaClass("java.lang.Class").isInstance(javaclass)) return javaclass;
					} catch (e) {
						throw new TypeError("Not a class: " + javaclass);
					}
				}
				return getNamedJavaClass(className);
			};

			this.isNativeJavaObject = function(object) {
				return String(object.getClass) == "function getClass() {/*\njava.lang.Class getClass()\n*/}\n";
			};

			this.test = {};
		};

		//	TODO	does this file need to know what directory it is in, or could it just use ./expression.js somehow?
		/** @type { slime.jrunscript.runtime.Exports } */
		var runtime = $rhino.script(
			"jrunscript/expression.js",
			String($loader.getLoaderCode("jrunscript/expression.js")),
			/** @type { slime.jrunscript.runtime.Scope } */({ $loader: $loader, $javahost: $javahost, $bridge: $bridge }),
			null
		);

		/** @type { (p: any) => slime.jrunscript.runtime.Rhino } */
		var castToRhino = function(v) { return v; };

		var rv = castToRhino(runtime);

		rv.java.sync = function(f,lock) {
			if (rv.java.getClass("inonit.script.runtime.Threads")) {
				return Packages.inonit.script.runtime.Threads.createSynchronizedFunction(lock,f);
			} else {
				return sync(f,lock);
			}
		};

		rv.java.thisSynchronize = function(f) {
			if (rv.java.getClass("org.mozilla.javascript.Synchronizer")) {
				return new Packages.org.mozilla.javascript.Synchronizer(f);
			} else {
				return sync(f);
			}
		}

		return rv;
	}
//@ts-ignore
)(Packages,(function() { return this; })().sync,$rhino,$loader)
