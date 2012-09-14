//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	return new function() {
		var $loader = new function() {
			this.code = String($bootstrap.getPlatformCode());
			this.script = function(name,$in,scope,target) {
				if (!target) target = null;
				$bootstrap.script(name,$in,scope,target);
				$in.close();
			}
			this.classpath = $bootstrap.getClasspath();
		};

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
			return eval($loader.code);
		})();

		var getCode = function(code) {
			if (typeof(code) == "object" && typeof(code.name) != "undefined" && typeof(code._in) != "undefined") {
				if (!code._in) {
					//	TODO	decide semantics of this
					throw new Error("code._in is null");
				}
				if ($loader.script) {
					return function() { $loader.script(code.name,code._in,arguments[0],arguments[1]); };
				} else {
					return String(
						new Packages.inonit.script.runtime.io.Streams().readString(code._in)
					);
				}
			} else if (typeof(code) == "object" && code._source && code.path) {
				return arguments.callee({
					name: code._source.toString() + ":" + code.path,
					_in: code._source.getResourceAsStream(code.path)
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

		var Loader = function(_source,root) {
			if (typeof(root) == "undefined") {
				root = "";
			}
			var Callee = arguments.callee;

			var p = new function() {
				this.getCode = function(path) {
					return getCode({
						_source: _source,
						path: root+path
					})
				};

				this.createChild = function(prefix) {
					return new Callee(_source,root+prefix);
					//	TODO	probably will not work correctly with child loaders? Would need access to the underlying getCode
				}
			}

			var delegate = new loader.Loader(p);
			delegate._resource = function(path) {
				return _source.getResourceAsStream(root+path);
			}
			return delegate;
		}

		this.Loader = function(p) {
			if (p._source) {
				return new Loader(p._source);
			} else if (p._code) {
				//	TODO	this is probably a bad place to do this, but it will do for now; actually should use loader decoration
				//			to do this
				$loader.classpath.append(p._code);
				return new Loader(p._code.getScripts());
			} else if (p.getCode) {
				return new loader.Loader({
					getCode: function(path) {
						debugger;
						return getCode(p.getCode(path));
					}
				});
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


					this.decorateLoader = function($loader) {
						$loader.java = new function() {
							this.read = function(path) {
								return _code.getScripts().getResourceAsStream(new Packages.java.lang.String(path));
							}
						}
					}
				}
			}

			if (format._code) {
				$loader.classpath.append(format._code);
				return loader.module(engineModuleCodeLoader(format._code, format.main),p);
			} else {
				return loader.module.apply(loader, arguments);
			}
		}

		this.classpath = new function() {
			this.add = function(_source) {
				$loader.classpath.append(_source);
			}

			this.getClass = function(name) {
				return $loader.classpath.getClass(name);
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