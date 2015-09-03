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
			},
			execute: function(script,scope,target) {
				return $javahost.script(script.name,script.code,scope,target);
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

	//	TODO	At least this method can move up the chain to the platform, one would think
	var getTypeFromPath = function(path) {
		if (/\.js$/.test(path)) return loader.mime.Type.parse("application/javascript");
		if (/\.coffee$/.test(path)) return loader.mime.Type.parse("application/vnd.coffeescript");
	};

	var addStringProperty = function(rv) {
		if (rv.type && ( rv.type.is("application/javascript") || rv.type.is("application/vnd.coffeescript") )) {
			Object.defineProperty(rv, "string", {
				get: function() {
					return String(_streams.readString(this._stream));
				}
			});
		}
	};

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
			if (p._source) {
				p.get = function(path) {
					var rv = {};
					var _file = p._source.getFile(path);
					if (!_file) return null;
					rv.name = _file.getSourceName();
					rv.type = getTypeFromPath(path);
					Object.defineProperty(rv, "_stream", {
						get: function() {
							return _file.getInputStream();
						}
					});
					Object.defineProperty(rv, "length", {
						get: function(path) {
							var length = _file.getLength();
							if (typeof(length) == "object" && length !== null && length.longValue) return Number(length.longValue());
						}
					});
					Object.defineProperty(rv, "modified", {
						get: function(path) {
							var _modified = _file.getLastModified();
							if (_modified) return _modified.getTime();
						}
					});
					addStringProperty(rv);
					return rv;
				};
				p.toString = function() {
					return "Java loader: " + p._source.toString();
				};
			}
			was.apply(this,arguments);
		}
	})(loader.Loader);
	loader.Loader.getTypeFromPath = getTypeFromPath;
	loader.Loader.addStringProperty = addStringProperty;

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

	loader.java = loader.file({ name: "rhino/java.js", string: String($javahost.getLoaderCode("rhino/java.js")) }, {
		$rhino: loader,
		liveconnect: liveconnect
	});
	loader.io = loader.file({ name: "rhino/io.js", string: String($javahost.getLoaderCode("rhino/io.js")) }, {
		_streams: _streams,
		api: {
			java: loader.java
		}
	});
//	loader.io = eval(String($javahost.getLoaderCode("rhino/io.js")));

	return loader;
})()