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
			getLoaderScript: function(path) {
				return {
					name: "slime://loader/" + path,
					code: String($javahost.getLoaderCode(path))
				};
			},
			getCoffeeScript: function(path) {
				var _code = $javahost.getCoffeeScript();
				if (_code) return { code: String(_code) };
				return null;
			}
		}
		return $javahost.script("slime://loader/literal.js",String($javahost.getLoaderCode("literal.js")),{
			$engine: $engine,
			$slime: $slime
		},null);
	})();

	loader.mime = (function(was) {
		var guess_URLConnection = function(p) {
			var _rv = Packages.java.net.URLConnection.getFileNameMap().getContentTypeFor(p.name);
			if (!_rv) return function(){}();
			return was.Type.parse(String(_rv));
		};

		was.Type.fromName = (function(was) {
			var rv = function(p) {
				var rv = was.apply(this,arguments);
				if (typeof(rv) != "undefined") return rv;
				rv = guess_URLConnection(p);
				return rv;
			};
			rv.slime = was;
			rv.java = {};
			rv.java.URLConnection = guess_URLConnection;
			return rv;
		})(was.Type.fromName);

		return was;
	})(loader.mime);

	loader.java = loader.file({ name: "slime://loader/rhino/java.js", string: String($javahost.getLoaderCode("rhino/java.js")) }, {
		engine: $bridge,
		classpath: $javahost.getClasspath()
	});
	loader.io = loader.file({ name: "slime://loader/rhino/io.js", string: String($javahost.getLoaderCode("rhino/io.js")) }, {
		_streams: _streams,
		api: {
			java: loader.java
		}
	});

	loader.Loader = (function(was) {
		var getTypeFromPath = function(path) {
			return loader.mime.Type.fromName(path);
		}

		//	Convert a Java inonit.script.engine.Code.Source.File to a resource
		var Resource = function(_file,path) {
			var parameter = {
				type: getTypeFromPath(path),
				read: {
					binary: function() {
						return new loader.io.InputStream(_file.getInputStream());
					}
				}
			};
			var length = _file.getLength();
			if (typeof(length) == "object" && length !== null && length.longValue) {
				parameter.length = Number(length.longValue());
			}
			loader.io.Resource.call(this,parameter);
			this.name = String(_file.getSourceName());
			var _modified = _file.getLastModified();
			if (_modified) this.modified = new Date( Number(_modified.getTime()) );
		}

		var rv = function(p) {
			if (p._unpacked) {
				p._code = $javahost.getClasspath().unpacked(p._unpacked);
			} else if (p._packed) {
				p._code = $javahost.getClasspath().slime(p._packed);
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
					return new Resource(_file,path);
				};
				p.child = function(prefix) {
					return {
						_source: p._source.child(prefix)
					}
				};
				if (p._source.getEnumerator()) {
					p.list = function(prefix) {
						var _paths = p._source.getEnumerator().list(prefix);
						if (!_paths) throw new Error("No enumerator list for " + p._source);
						var rv = [];
						for (var i=0; i<_paths.length; i++) {
							var path = String(_paths[i]);
							if (/\/$/.test(path)) {
								rv.push({ path: path.substring(0,path.length-1), loader: true, resource: false });
							} else {
								rv.push({ path: path, loader: false, resource: true });
							}
						}
						return rv;
					}
				}
				p.toString = function() {
					return "Java loader: " + p._source.toString();
				};
			} else if (p.resources) {
				if (Packages.java.lang.System.getenv("SLIME_LOADER_RHINO_REMOVE_DEPRECATED")) throw new Error();
				//	TODO	would be nice to get rid of this, but it is used in rhino/http/servlet, it appears
				loader.$api.deprecate(function() {
					p.get = function(path) {
						var resource = p.resources.get(String(path));
						if (!resource) return null;
						var rv = new loader.io.Resource(resource);
						if (!rv.name) {
							rv.name = p.resources.toString() + "!" + String(path);
						}
						if (!rv.type) {
							rv.type = getTypeFromPath(path);
						}
	//					rv.java = {
	//						InputStream: function() {
	//							return resource.read.binary().java.adapt()
	//						}
	//					};
	//					rv.resource = rv;
						return rv;
					};
					if (!p.child) p.child = function(prefix) {
						return {
							resources: {
								get: function(path) {
									return p.resources.get(prefix + path);
								}
							}
						}
					};
				})();
			}
			was.apply(this,arguments);
//			if (true || p._source || p.resources) {
//				this.resource = loader.$api.deprecate(function(path) {
//					return p.get(path);
//				});
//			}
		};
		rv.series = was.series;
		return rv;
	})(loader.Loader);

	loader.classpath = new function() {
		this.setAsThreadContextClassLoaderFor = function(_thread) {
			$javahost.getClasspath().setAsThreadContextClassLoaderFor(_thread);
		};

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