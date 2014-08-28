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
			},
			getCoffeeScript: function(path) {
				var _code = $javahost.getCoffeeScript();
				if (_code) return { code: String(_code) };
				return null;
			}
		}
		return eval(String($javahost.getLoaderCode("literal.js")));
	})();

	loader.run.spi.preprocess(function(underlying) {
		return function(script) {
			if (script.name && script._in) {
				//	ready
			} else if (script._source && script.path) {
				script._in = script._source.getResourceAsStream(script.path);
				if (!script._in) throw new Error("Could not find resource at " + script.path + " in " + script._source);
				script.name = script._source.toString() + ":" + script.path;
			} else if (script.name && !script._in) {
				throw new Error("script._in is null for name = " + script.name);
			} else {
				throw new Error("Unimplemented: script = " + script);
			}
			script.code = String(_streams.readString(script._in));
			delete script._in;
		}
	})

	loader.run.spi.execute(function(underlying) {
		return function(script) {
			return $javahost.script(script.name,script.code,script.scope,script.target);
		}
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
		
		var Child = function(prefix) {
			return new Loader({ _source: p._source.child(prefix) });
		}

		var parameter = new function() {
			this.getScript = function(path) {
				return {
					_source: p._source,
					path: path
				}
			};
			
			this.Loader = loader.$api.Constructor.decorated(Child,p.Loader);
		};

		var rv = new loader.Loader(parameter);
		decorate.call(rv,p._source);
		return rv;
	}

//<<<<<<< local
	loader.Loader = loader.$api.Function(
		loader.$api.Function.conditional(
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
		)
	).prepare(function(p) {
		var Code = Packages.inonit.script.engine.Code;
		if (p._unpacked) {
			p._code = Code.unpacked(p._unpacked);
		} else if (p._packed) {
			p._code = Code.slime(p._packed);
		}
	});
//=======
//			var parameter = new function() {
//				this.toString = function() {
//					return "rhino/literal.js: _source = " + p._source;
//				};
//
//				this.getCode = function(path) {
//					return getCode({
//						_source: p._source,
//						path: path
//					})
//				};
//>>>>>>> other

//<<<<<<< local
	loader.classpath = new function() {
		this.toString = function() {
			return String($javahost.getClasspath());
//=======
//				this.Child = function(prefix) {
//					var c = {
//						_source: p._source.child(prefix),
//						Loader: (p.Loader) ? function() {
//							return p.Loader.call(this,prefix);
//						} : null
//					};
//					var rv = new Callee(c);
//					if (p.Loader) {
//						var returned = p.Loader.call(rv,prefix);
//						if (typeof(returned) == "object" && returned != null) {
//							rv = returned;
//						}
//					}
//					return rv;
//				}
//			};
//
//			var rv = new loader.Loader(parameter);
//			rv.toString = function() {
//				return parameter.toString();
//			}
//			rv._stream = function(path) {
//				return p._source.getResourceAsStream(path);
//			};
//			rv._resource = loader.$api.deprecate(rv._stream);
//			return rv;
//>>>>>>> other
		}

		this.add = function(_source) {
			$javahost.getClasspath().append(_source);
		}

		this.getClass = function(name) {
			return $javahost.getClasspath().getClass(name);
		}
	}

	return loader;
})()