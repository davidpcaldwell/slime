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
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	var loader = (function() {
		var $engine = {
			Object: {
				defineProperty: {}
			}
		};
		(function() {
			if ($javahost.setReadOnly) $engine.Object.defineProperty.setReadOnly = $javahost.setReadOnly;
			if ($javahost.MetaObject) $engine.MetaObject = $javahost.MetaObject;
		})();
		var $slime = {
			getCode: function(path) {
				return String($javahost.getLoaderCode(path));
			}
		}
		return eval(String($javahost.getLoaderCode("literal.js")));
	})();
	
	loader.run.spi(function(script) {
		if (script.name && script._in) {
			//	ready
		} else if (script._source && script.path) {
			var replace = {};
			replace._in = script._source.getResourceAsStream(script.path);
			if (!replace._in) throw new Error("Could not find resource at " + script.path + " in " + script._source);
			replace.name = script._source.toString() + ":" + script.path;
			replace.scope = script.scope;
			replace.target = script.target;
			script = replace;
		} else if (script.name && !script._in) {
			throw new Error("script._in is null for name = " + script.name);				
		} else {
			throw new Error("Unimplemented: script = " + script);
		}
		$javahost.script(script.name,_streams.readString(script._in),script.scope,script.target);
	});

	var Loader = function(p) {
		var decorate = function(_source) {
			this.toString = function() {
				return "Java loader: " + _source.toString();
			}

			this._stream = function(path) {
				return _source.getResourceAsStream(path);
			};
			this._resource = loader.$api.deprecate(this._stream);			
		}

		if (!p._source) throw new TypeError("_source must be defined and not be null.");

		var parameter = new function() {
			this.getCode = function(path) {
				return {
					_source: p._source,
					path: path
				}
			};

			this.Loader = function(prefix) {
				return (p.Loader) ? new p.Loader(prefix) : new Loader({ _source: p._source.child(prefix) });
			}
		};

		var rv = new loader.Loader(parameter);
		decorate.call(rv,p._source);
		return rv;
	}

	loader.Loader = loader.$api.Function.conditional(
		function(p) {
			return p._source || p._code;
		}, 
		function(p) {
			if (p._source) {
				return new Loader(p);
			} else if (p._code) {
				//	TODO	this is probably a bad place to do this, but it will do for now; should this move into the Loader
				//			constructor?
				$javahost.getClasspath().append(p._code);
				return new Loader({
					_source: p._code.getScripts(),
					Loader: p.Loader
				});
			}
		},
		loader.Loader
	);
	
	loader.classpath = new function() {
		this.toString = function() {
			return String($javahost.getClasspath());
		}

		this.add = function(_source) {
			$javahost.getClasspath().append(_source);
		}

		this.getClass = function(name) {
			return $javahost.getClasspath().getClass(name);
		}
	}
	
	loader.Module = new function() {
		var Code = Packages.inonit.script.engine.Code;

		//	java.io.File, string
		this.unpacked = function(_base,main) {
			return { _code: Code.unpacked(_base), main: main };
		}

		//	java.io.File, string
		this.packed = function(_slime,main) {
			return { _code: Code.slime(_slime), main: main };
		}
	};
		
	return loader;
})()