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

	loader.run.spi.execute(function(underlying) {
		return function(script,scope,target) {
			return $javahost.script(script.name,script.code,scope,target);
		}
	});

	loader.Loader = (function(was) {
		return function(p) {
			var Code = Packages.inonit.script.engine.Code;
			if (p._unpacked) {
				p._code = Code.unpacked(p._unpacked);
			} else if (p._packed) {
				p._code = Code.slime(p._packed);
			}
			if (p._code) {
				$javahost.getClasspath().append(p._code);
				p._source = p._code.getScripts();
			}
			if (p._source || p._stream) {
				p.get = function(path) {
					var rv = {
						_source: p._source,
						path: path
					};

					if (p._source) {
						var _stream = function() {
							var _file = p._source.getFile(path);
							return (_file) ? _file.getInputStream() : null;
						};
						Object.defineProperty(rv, "_stream", {
							get: _stream
						});
						Object.defineProperty(rv, "name", {
							get: function() {
								return String(p._source.getFile(path).getSourceName());
							}
						});
					} else if (p._stream) {
						Object.defineProperty(rv, "_stream", {
							get: function() {
								return p._stream(path);
							}
						});
					}
					Object.defineProperty(rv, "code", {
						get: function() {
//							var _file = p._source.getFile(path);
//							if (!_file) throw new Error("No file at " + path + " in " + p._source);
//							var _in = _file.getInputStream();
							var _in = this._stream;
							if (!_in) throw new Error("No file at " + path + " in source=" + p._source);
							return String(_streams.readString(_in));
						}
					});
					Object.defineProperty(rv, "_resource", {
						get: loader.$api.deprecate(function() {
							return this._stream;
						})
					});
					Object.defineProperty(rv, "length", {
						get: function(path) {
							var _file = p._source.getFile(path);
							if (!_file) return void(0);
							var length = _file.getLength();
							if (typeof(length) == "object" && length !== null && length.longValue) return Number(length.longValue());
						}
					});
					return rv;
				};
//				this._stream = function(path) {
//					return p._stream.call(this.path);
//				}
			} else if (p._stream) {
				p.get = function(path) {
					throw new Error("Unimplemented for _stream");
				}
//				this._stream = function(path) {
//					return p._stream.call(this.path);
//				}
			}
//			p.Loader = (function(custom) {
//				return loader.$api.Constructor.decorated(function(prefix) {
//					if (p._source) {
//						return new loader.Loader({ _source: p._source.child(prefix) });
//					}
//				}, custom);
//			})(p.Loader);
			if (!p.get) {
				throw new Error("No p.get! keys=" + Object.keys(p));
			}
			was.apply(this,arguments);
			if (p._source) {
				this.toString = function() {
					return "Java loader: " + p._source.toString();
				}

				this._stream = function(path) {
					var _file = p._source.getFile(path);
					return (_file) ? _file.getInputStream() : null;
				};
//				this._resource = loader.$api.deprecate(this._stream);

//				p.length = function(path) {
//					var _file = p._source.getFile(path);
//					var length = _file.getLength();
//					if (typeof(length) == "object" && length !== null && length.longValue) return Number(length.longValue());
//				};
//			} else if (p._stream) {
//				this._stream = function(path) {
//					return p._stream.call(this,path);
//				};
			}

		}
	})(loader.Loader);

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

	return loader;
})()