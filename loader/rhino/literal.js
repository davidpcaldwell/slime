//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	return new function() {
		var loader = (function() {
			var $engine = {
				Object: {
					defineProperty: {}
				}
			};
			(function() {
				var $objects = new Packages.inonit.script.rhino.Objects();
				$engine.Object.defineProperty.setReadOnly = function(object,name,value) {
					$objects.setReadOnly(object,name,value);
				}

				$engine.MetaObject = function(p) {
					var delegate = (p.delegate) ? p.delegate : {};
					var get = (p.get) ? p.get : function(){};
					var set = (p.set) ? p.set : function(){};
					return Packages.inonit.script.rhino.MetaObject.create(delegate,get,set);
				}
			})();
			var $slime = {
				getCode: function(path) {
					return String($rhino.getLoaderCode(path));
				}
			}
			return eval(String($rhino.getLoaderCode("literal.js")));
		})();

		var getCode = function(code) {
			var script = function(name,_in,scope,target) {
				if (!target) target = null;
				$rhino.script(name,_in,scope,target);
				_in.close();
			};

			if (typeof(code) == "object" && typeof(code.name) != "undefined" && typeof(code._in) != "undefined") {
				if (!code._in) {
					//	TODO	decide semantics of this
					throw new Error("code._in is null for name = " + code.name);
				}
				if (script) {
					return function() {
						script(code.name,code._in,arguments[0],arguments[1]);
					};
				} else {
					return String(
						new Packages.inonit.script.runtime.io.Streams().readString(code._in)
					);
				}
			} else if (typeof(code) == "object" && code._source && code.path) {
				var _in = code._source.getResourceAsStream(code.path);
				if (!_in) throw new Error("Could not find resource at " + code.path + " in " + code._source);
				return arguments.callee({
					name: code._source.toString() + ":" + code.path,
					_in: _in
				});
			} else if (typeof(code) == "string") {
				return code;
			} else {
				throw new Error("Unimplemented: code = " + code);
			}
		}

		this.run = function(code,scope,target) {
			loader.run(getCode(code),scope,target);
		}

		this.file = function(code,$context) {
			return loader.file(getCode(code),$context);
		}

		this.Module = new function() {
			var Code = Packages.inonit.script.rhino.Code;

			//	java.io.File, string
			this.unpacked = function(_base,main) {
				return { _code: Code.unpacked(_base), main: main };
			}

			//	java.io.File, string
			this.packed = function(_slime,main) {
				return { _code: Code.slime(_slime), main: main };
			}
		};

		var Loader = function(p) {
			if (!p._source) throw new TypeError("_source must be defined and not be null.");
			var Callee = arguments.callee;

			var parameter = new function() {
				this.getCode = function(path) {
					return getCode({
						_source: p._source,
						path: path
					})
				};

				this.Child = function(prefix) {
					var c = {
						_source: p._source.child(prefix),
						Loader: (p.Loader) ? function() {
							return p.Loader.call(this,prefix);
						} : null
					};
					var rv = new Callee(c);
					if (p.Loader) {
						var returned = p.Loader.call(rv,prefix);
						if (typeof(returned) == "object" && returned != null) {
							rv = returned;
						}
					}
					return rv;
				}
			};

			var rv = new loader.Loader(parameter);
			rv._stream = function(path) {
				return p._source.getResourceAsStream(path);
			};
			rv._resource = loader.$api.deprecate(rv._stream);
			return rv;
		}

		this.Loader = function(p) {
			if (p._source) {
				return new Loader(p);
			} else if (p._code) {
				//	TODO	this is probably a bad place to do this, but it will do for now; should this move into the Loader
				//			constructor?
				$rhino.getClasspath().append(p._code);
				return new Loader({
					_source: p._code.getScripts(),
					Loader: p.Loader
				});
			} else if (p.getCode) {
				//	TODO	document this; it is confusing; should p.Loader be disallowed or flagged here since platform loader
				//			will ignore it?
				return new loader.Loader({
					getCode: function(path) {
						debugger;
						return getCode(p.getCode(path));
					}
				});
			} else {
				throw new TypeError();
			}
		}

		//	Only modules may currently contain Java classes, which causes the API to be somewhat different
		//	Code currently contains a Code.Source for scripts and a Code.Source for classes
		//	TODO	we probably need to allow the script side to implement Source, at least, to support the use of this API
		this.module = function(format,p) {
			debugger;

			var engineModuleCodeLoader = function(_code,main) {
				return new function() {
					this.main = main;

					this.getCode = function(path) {
						var $in = _code.getScripts().getResourceAsStream(new Packages.java.lang.String(path));
						if (!$in) throw "Missing module file: " + path + " in " + _code;
						return getCode({
							name: String(_code) + ":" + path,
							_in: $in
						});
					};

					//	TODO	untested explicitly, although presumably unit tests already cover this as modules are loaded within
					//			modules pretty often
					this.Child = function(prefix) {
						this.java = new function() {
							this.read = function(path) {
								return _code.getScripts().getResourceAsStream(new Packages.java.lang.String(prefix+path));
							}
						}
					};
				}
			}

			if (format._code) {
				$rhino.getClasspath().append(format._code);
				return loader.module(engineModuleCodeLoader(format._code, format.main),p);
			} else {
				return loader.module.apply(loader,arguments);
			}
		}

		this.classpath = new function() {
			this.toString = function() {
				return String($rhino.getClasspath());
			}

			this.add = function(_source) {
				$rhino.getClasspath().append(_source);
			}

			this.getClass = function(name) {
				return $rhino.getClasspath().getClass(name);
			}
		}

		this.namespace = function(name) {
			return loader.namespace(name);
		}

		//	currently only used by jsapi in jsh/unit via jsh.js, so undocumented
		this.$platform = loader.$platform;

		//	currently used to set deprecation warning in jsh.js
		//	currently used by jsapi in jsh/unit via jsh.js
		this.$api = loader.$api;
	};
})()