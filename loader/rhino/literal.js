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
			if (typeof(code) == "object" && code.name && code.$in) {
				if ($loader.script) {
					return function() { $loader.script(code.name,code.$in,arguments[0],arguments[1]); };
				} else {
					return String(
						new Packages.inonit.script.runtime.io.Streams().readString(code.$in)
					);
				}
			} else if (typeof(code) == "string") {
				return code;
			} else {
				throw "Unimplemented: code = " + code;
			}
		}

		this.run = function(code,scope,target) {
			loader.run(getCode(code),scope,target);
		}

		this.file = function(code,$context) {
			return loader.file(getCode(code),$context);
		}

		var engineModuleCodeLoader = function($engine_module) {
			return new function() {
				this.main = String($engine_module.getScripts().getMain());

				this.getCode = function(path) {
					var $in = $engine_module.getScripts().getSource().getResourceAsStream(new Packages.java.lang.String(path));
					if (!$in) throw "Missing module file: " + path + " in " + $engine_module;
					return getCode({
						name: String($engine_module) + ":" + path,
						$in: $in
					});
				};


				this.decorateLoader = function($loader) {
					$loader.java = new function() {
						this.read = function(path) {
							return $engine_module.getScripts().getSource().getResourceAsStream(new Packages.java.lang.String(path));
						}
					}
				}
			}
		}

		//	Only modules may currently contain Java classes, which causes the API to be somewhat different
		//	Module.Code currently encompasses Scripts and Classes
		//	Scripts have a Source and a main file
		//	Classes have only a Source
		//	TODO	we probably need to allow the script side to implement Source, at least, to support the use of this API
		this.module = function(_Module_Code,p) {
			$loader.classpath.append(_Module_Code);
			return loader.module(engineModuleCodeLoader(_Module_Code),p);
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
