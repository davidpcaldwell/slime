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

	var getTypeFromPath = function(path) {
		return loader.mime.Type.fromName(path);
	}

	//	Convert a Java inonit.script.engine.Code.Source.File to a resource
	//	TODO	should this logic be pushed into loader.io? Probably
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
		this.java = {
			adapt: function() {
				return _file;
			}
		}
	};
	Resource.toCodeSourceFile = function(resource,path) {
		if (!resource) return null;
		//	TODO	cheat by storing Code.Source.File for resources created by this source file. Design smell that we
		//			need to convert back and forth between Java and script versions
		if (resource.java && resource.java.adapt) return resource.java.adapt();
		return new JavaAdapter(
			Packages.inonit.script.engine.Code.Source.File,
			new function() {
				["getURI","getSourceName","getInputStream","getLength","getLastModified"].forEach(function(methodName) {
					this[methodName] = function() {
						throw new Error("Unimplemented: " + methodName);
					};
				},this);

				this.getURI = function() {
					return Packages.inonit.script.engine.Code.Source.URI.script(
						"literal.js",
						path
					)
				}

				this.getSourceName = function() {
					return (resource.name) ? resource.name : null;
				}

				this.getInputStream = function() {
					if (!resource.read) throw new Error("Cannot read " + resource);
					return resource.read.binary().java.adapt();
				}
			}
		)
	};

	loader.Loader = (function(was) {
		var rv = function(p) {
			if (p.zip) {
				if (p.zip._file) {
					p._source = Packages.inonit.script.engine.Code.Source.zip(p.zip._file);
				} else if (p.zip.resource) {
					p._source = Packages.inonit.script.engine.Code.Source.zip(Resource.toCodeSourceFile(p.zip.resource,p.zip.resource.name));
				}
			} else if (p._file && p._file.isDirectory()) {
				p._source = Packages.inonit.script.engine.Code.Source.create(p._file);
			} else if (p._url) {
				//	TODO	no known test coverage
				p._source = Packages.inonit.script.engine.Code.Source.create(p._url);
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
			var source = this.source;
			var self = this;
			this.java = {
				adapt: function() {
					if (source._source) return source._source;
					return new JavaAdapter(
						Packages.inonit.script.engine.Code.Source,
						new function() {
							this.getFile = function(path) {
								var resource = self.get(path);
								return Resource.toCodeSourceFile(resource,path);
							};

							this.getClasses = function() {
								throw new Error("Unimplemented: getClasses");							
							};

							this.getEnumerator = function() {
								throw new Error("Unimplemented: getEnumerator");
							}
						}
					)		
				}
			};
		};
		rv.series = was.series;
		return rv;
	})(loader.Loader);
	
	loader.classpath = new (function(_classpath) {
		this.toString = function() {
			return String(_classpath);
		};
		
		this.setAsThreadContextClassLoaderFor = function(_thread) {
			_classpath.setAsThreadContextClassLoaderFor(_thread);
		};

		this.getClass = function(name) {
			return _classpath.getClass(name);
		};
		
		this.add = function(p) {
			if (p._file && p._file.isDirectory()) {
				_classpath.add(Packages.inonit.script.engine.Code.Source.create(p._file));
			} else if (p._file && p._file.exists() && !p._file.isDirectory()) {
				//	Currently can be used to add .jar directly to classpath through jsh.loader.java.add
				//	TODO	determine whether this should be switched to jar._file; used by servlet plugin to put Tomcat classes
				//			in classpath
				_classpath.add(Packages.inonit.script.engine.Code.Source.create(p._file));				
			} else if (p.slime) {
				if (p.slime.loader) {
					_classpath.add(p.slime.loader.java.adapt().child("$jvm/classes"));
				} else {
					throw new Error();
				}
			} else if (p.jar) {
				if (p.jar._file) {
					_classpath.add(Packages.inonit.script.engine.Code.Source.zip(p.jar._file));
				} else if (p.jar.resource) {
					_classpath.add(Packages.inonit.script.engine.Code.Source.zip(Resource.toCodeSourceFile(p.jar.resource,p.jar.resource.name)));					
				} else {
					throw new Error();
				}
			} else if (p.src) {
				if (p.src.loader) {
					_classpath.add(_classpath.compiling(p.src.loader.java.adapt()));					
				} else {
					throw new Error();
				}
			} else {
				throw new Error("No relevant handler for add(" + p + ")");
			}
		};
	})($javahost.getClasspath())

	return loader;
})()