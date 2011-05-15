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

new function() {
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

	var engineModuleCodeLoader = function($engine_module) {
		return new function() {
			this.main = String($engine_module.getMainScriptPath());

			this.getCode = function(path) {
				//	TODO	maybe should only be with debugging on?
				if ($loader.script) {
					var $in = $engine_module.read(new Packages.java.lang.String(path));
					if (!$in) throw "Missing module file: " + path + " in " + $engine_module;
					return function() { $loader.script(arguments[0],String($engine_module) + ":" + path,$in) };
				} else {
					var $in = $engine_module.read(new Packages.java.lang.String(path));
					if (!$in) throw "Missing module file: " + path + " in " + $engine_module;
					return String(
						new Packages.inonit.script.runtime.io.Streams().readString($in)
					);
				}
			};
		}
	}

	this.module = function($module,p) {
		return loader.module(engineModuleCodeLoader($module), p);
	}

	this.script = function(code,scope) {
		//	TODO	maybe should only be with debugging on? Although this way name will be used in stack traces
		if ($loader.script && typeof(code) == "object" && code.name && code.$in) {
			return loader.script(function() { $loader.script(arguments[0],code.name,code.$in); },scope);
		} else if (typeof(code) == "string") {
			return loader.script(code,scope);
		} else {
			throw "Unimplemented: arguments = " + Array.prototype.join.call(arguments,",");
		}
	}

	this.namespace = function(name) {
		return loader.namespace(name);
	}

	//	currently only used by jsapi in jsh/unit via jsh.js, so undocumented
	this.$platform = loader.$platform;
	this.$api = loader.$api;
}
