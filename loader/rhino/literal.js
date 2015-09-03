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
					return String(_streams.readString(rv.java.InputStream()));
				}
			});
		}
	};

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
					rv.java = {};
					rv.java.InputStream = function() {
						return _file.getInputStream();
					}
					var length = _file.getLength();
					if (typeof(length) == "object" && length !== null && length.longValue) {
						rv.length = Number(length.longValue());
					}
					var _modified = _file.getLastModified();
					if (_modified) rv.modified = _modified.getTime();
					addStringProperty(rv);
					rv.resource = new loader.io.Resource({
						type: rv.type,
						length: rv.length,
						read: {
							binary: function() {
								return new loader.io.InputStream(_file.getInputStream());
							}
						}
					})
					return rv;
				};
				p.toString = function() {
					return "Java loader: " + p._source.toString();
				};
			} else if (p.resources) {
				p.get = function(path) {
					var resource = p.resources.get(String(path));
					if (resource) {
						var rv = {
							name: p.resources.toString() + "!" + String(path),
							length: resource.length,
							modified: resource.modified,
							type: resource.type
						};
						if (!rv.type) {
							rv.type = getTypeFromPath(path);
						}
						rv.java = {
							InputStream: function() {
								return resource.read.binary().java.adapt()
							}
						};
						addStringProperty(rv);
						rv.resource = new loader.io.Resource(resource);
						return rv;
					} else {
						return null;
					}
				};
			}
			was.apply(this,arguments);
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