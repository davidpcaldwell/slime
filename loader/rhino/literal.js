//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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
			if (typeof(code) == "object" && code.name && code._in) {
				if ($loader.script) {
					return function() { $loader.script(code.name,code._in,arguments[0],arguments[1]); };
				} else {
					return String(
						new Packages.inonit.script.runtime.io.Streams().readString(code._in)
					);
				}
			} else if (typeof(code) == "object" && code._source && code.path) {
				return arguments.callee({
					name: code._source.toString(),
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

		var engineModuleCodeLoader = function($engine_module,main) {
			return new function() {
				this.main = main;

				this.getCode = function(path) {
					var $in = $engine_module.getScripts().getResourceAsStream(new Packages.java.lang.String(path));
					if (!$in) throw "Missing module file: " + path + " in " + $engine_module;
					return getCode({
						name: String($engine_module) + ":" + path,
						_in: $in
					});
				};


				this.decorateLoader = function($loader) {
					$loader.java = new function() {
						this.read = function(path) {
							return $engine_module.getScripts().getResourceAsStream(new Packages.java.lang.String(path));
						}
					}
				}
			}
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

		//	Only modules may currently contain Java classes, which causes the API to be somewhat different
		//	Code currently contains a Code.Source for scripts and a Code.Source for classes
		//	TODO	we probably need to allow the script side to implement Source, at least, to support the use of this API
		this.module = function(format,p) {
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
