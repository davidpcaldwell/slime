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

//@ts-check
(
	/**
	 * @param { slime.jrunscript.runtime.$javahost } $javahost
	 * @param { slime.jrunscript.runtime.java.Engine } $bridge
	 * @param { Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { any } XML
	 * @param { Packages.inonit.script.engine.Loader } $loader
	 * @returns { slime.jrunscript.runtime.Exports }
	 */
	function($javahost,$bridge,Packages,JavaAdapter,XML,$loader) {
		/** @type { Packages.inonit.script.runtime.io.Streams } */
		var _streams = new Packages.inonit.script.runtime.io.Streams();

		var loader = {};

		var slime = (
			/**
			 * @returns { slime.runtime.Exports }
			 */
			function() {
				var instance = (function _Throwables() {
					return new Packages.inonit.script.runtime.Throwables();
				})();

				var errorDecorate = function(implementation) {
					var rv = function() {
						//	TODO	what if called as function?
						var literals = Array.prototype.map.call(arguments,function(a,i) {
							return "arguments["+i+"]";
						}).join(",");
						//	TODO	is this parameterized call already in js/object?
						var created = eval("new implementation(" + literals + ")");

						if (!created.stack) {
							var tracer;
							try {
								instance.throwException(created.toString());
							} catch (e) {
								tracer = e;
							}
							var t = tracer.rhinoException;
							var stack = [];
							while(t != null) {
								var sw = new Packages.java.io.StringWriter();
								var pw = new Packages.java.io.PrintWriter(sw);
								if (t == tracer.rhinoException) {
									sw.write(t.getScriptStackTrace());
								} else {
									t.printStackTrace(pw);
								}
								pw.flush();
								var tstack = String(sw.toString()).split(String(Packages.java.lang.System.getProperty("line.separator")));
								if (t == tracer.rhinoException) {
									tstack = tstack.slice(1,tstack.length);
								}
								for (var i=0; i<tstack.length; i++) {
									if (/^Caused by\:/.test(tstack[i])) {
										break;
									}
									stack.push(tstack[i]);
								}
								t = t.getCause();
								if (t != null && String(t.getClass().getName()) == "inonit.script.runtime.Throwables$Exception") {
									t = null;
								}
							}
							//	TODO	clean up the first line, eliminating all the wrapping in WrappedException and Throwables.Exception
							//	TODO	clean up the top of the trace, removing the irrelevant Java lines and the first script line corresponding
							//			to this file
							//	TODO	get full stack traces if possible, rather than the limited version being provided now (which has ...more)
							//			however, could be impossible (getStackTrace may not be overridden while printStackTrace is).
							created.stack = stack.join("\n");
						}
						return created;
					}
					rv.prototype = implementation.prototype;
					return rv;
				};

				var $engine = {
					Object: {
						defineProperty: {}
					},
					execute: function(script,scope,target) {
						return $javahost.script(script.name,script.js,scope,target);
					},
					Error: {
						decorate: function(was) {
							return errorDecorate(was);
							// throw new TypeError("Can't decorate nothing was: " + was);
						}
					}
				};
				//	TODO	decorate global Error objects; see jrunscript/host/module.js

				(function() {
					if ($javahost.setReadOnly) $engine.Object.defineProperty.setReadOnly = $javahost.setReadOnly;
					if ($javahost.MetaObject) $engine.MetaObject = $javahost.MetaObject;
				})();
				var $slime = {
					getRuntimeScript: function(path) {
						return {
							name: "slime://loader/" + path,
							js: String($loader.getLoaderCode(path))
						};
					},
					getCoffeeScript: function(path) {
						var _code = $loader.getCoffeeScript();
						if (_code) return { code: String(_code) };
						return null;
					},
					typescript: $loader.getTypescript(),
					flags: {}
				};
				if (!$javahost.noEnvironmentAccess) {
					var flagPattern = /^SLIME_(.*)$/;
					var _entries = Packages.java.lang.System.getenv().entrySet().iterator();
					while(_entries.hasNext()) {
						var _entry = _entries.next();
						var name = String(_entry.getKey());
						var value = String(_entry.getValue());
						var match = flagPattern.exec(name);
						if (match) {
							$slime.flags[match[1]] = value;
						}
					}
				}
				return $javahost.eval("slime://loader/expression.js",String($loader.getLoaderCode("expression.js")),{
					$engine: $engine,
					$slime: $slime
				},null);
			}
		)();

		Object.assign(loader, slime);

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
					rv = guess_URLConnection({ name: p });
					return rv;
				};
				rv.slime = was;
				rv.java = {};
				rv.java.URLConnection = guess_URLConnection;
				return rv;
			})(was.Type.fromName);

			return was;
		})(loader.mime);

		loader.java = loader.file(new loader.Resource({ name: "slime://loader/jrunscript/java.js", string: String($loader.getLoaderCode("jrunscript/java.js")) }), {
			engine: $bridge,
			classpath: $loader.getClasspath()
		});

		loader.io = loader.file(new loader.Resource({ name: "slime://loader/jrunscript/io.js", string: String($loader.getLoaderCode("jrunscript/io.js")) }), {
			_streams: _streams,
			api: {
				java: loader.java,
				Resource: loader.Resource
			}
		});

		var getTypeFromPath = function(path) {
			return loader.mime.Type.fromName(path);
		}

		/** @type { slime.jrunscript.runtime.Exports["Resource"] } */
		var Resource = (function(was) {
			var rv = (
				/**
				 * @param { slime.jrunscript.runtime.Resource.Descriptor } p
				 * @constructor
				 */
				function(p) {
					if (p.stream && p.stream.binary) {
						if (!p.read) p.read = {};
						p.read.binary = (function(stream) {
							var _bytes;

							return function() {
								if (!_bytes) {
									_bytes = stream.java.array();
								}
								return new loader.io.InputStream(new Packages.java.io.ByteArrayInputStream(_bytes));
							}
						})(p.stream.binary);
					}

					if (p._loaded) {
						if (!p.read) p.read = {};
						p.read.binary = function() {
							return new loader.io.InputStream(p._loaded.resource.getInputStream());
						}
					}

					var binary = (function() {
						if (p.read && p.read.binary) {
							return function() {
								return p.read.binary();
							}
						}
					})();

					// TODO: Probably should implement this method if the argument provides a string or read.string also
					var text = (function() {
						if (p.read && p.read.text) {
							return function() {
								return p.read.text();
							}
						}
						if (p.read && p.read.string) {
							return function() {
								return new loader.io.Reader(new Packages.java.io.StringReader(p.read.string()));
							}
						}
						if (p.string) {
							return function() {
								return new loader.io.Reader(new Packages.java.io.StringReader(p.string));
							}
						}
						if (p.read && p.read.binary) {
							return function() {
								return p.read.binary().character();
							}
						}
					})();

					if (p.read && !p.read.string) {
						p.read.string = function() {
							return text().asString();
						}
					}

					was.apply(this,arguments);

					//	TODO	probably should allow name property to be passed in and then passed through
					if (p._loaded) {
						if (!this.type) {
							this.type = loader.mime.Type.fromName(p._loaded.path);
						}

						if (typeof(p.length) == "undefined") Object.defineProperty(
							p,
							"length",
							new function() {
								this.get = function() {
									var length = p._loaded.resource.getLength();
									if (typeof(length) == "object" && length !== null && length.longValue) {
										return Number(length.longValue());
									}
								};
								this.enumerable = true;
							}
						);

						this.name = String(p._loaded.resource.getSourceName());

						Object.defineProperty(
							this,
							"modified",
							new function() {
								this.get = function() {
									var _modified = p._loaded.resource.getLastModified();
									if (_modified) return new Date( Number(_modified.getTime()) );
								};
								this.enumerable = true;
							}
						);

						this.java = {
							adapt: function() {
								return p._loaded.resource;
							}
						}
					}

					if (this.type) {
						//	Go ahead and make it immutable; in Java we know we have Object.defineProperty
						(function(type) {
							Object.defineProperty(this, "type", {
								get: function() {
									return type;
								},
								enumerable: true
							})
						}).call(this,this.type);
					}

					if (this.name) {
						//	Go ahead and make it immutable; in Java we know we have Object.defineProperty
						(function(name) {
							Object.defineProperty(this, "name", {
								get: function() {
									return name;
								},
								enumerable: true
							})
						}).call(this,this.name);
					}

					/** @property { string } string */
					this.string = this.string;

					if (typeof(this.string) == "undefined") Object.defineProperty(this, "string", {
						get: loader.$api.deprecate(loader.$api.Function.memoized(function() {
							return text().asString();
						}))
					});

					/** @type { slime.jrunscript.runtime.Resource["read"] } */
					var read = this.read;

					/** @property { slime.jrunscript.runtime.Exports["Resources"] } */
					this.read = read;

					this.read = Object.assign(
						(function(was,global) {
							return function(mode) {
								var rv = (was) ? was.apply(this,arguments) : void(0);
								if (typeof(rv) != "undefined") return rv;

								var _properties = function(peer) {
									//	peer can be Packages.java.io.InputStream or Packages.java.io.Reader
									var properties = new Packages.java.util.Properties();
									properties.load( peer );
									peer.close();
									return properties;
								}

								if (binary) {
									if (mode == loader.io.Streams.binary) return binary();
									if (mode == Packages.java.util.Properties) return _properties(binary().java.adapt());
								}
								if (text) {
									if (mode == loader.io.Streams.text) return text();
									if (mode == String) return text().asString();
									if (mode == Packages.java.util.Properties) return _properties(text().java.adapt());
									if (mode == global.XML) return loader.$api.deprecate(function() {
										return XML(text().asString())
									})();
								}
								var parameters = (function() {
									if (!p) return String(p);
									if (typeof(p) == "object") return String(p) + " with keys: " + Object.keys(p);
									return String(p);
								})();
								throw new TypeError("No compatible read() mode specified: parameters = " + parameters + " binary=" + binary + " text=" + text + " argument was " + mode
									+ " Streams.binary " + (mode == loader.io.Streams.binary)
									+ " Streams.text " + (mode == loader.io.Streams.text)
									+ " XML " + (mode == global.XML)
									+ " String " + (mode == String)
								);
							};
						})(this.read, function() { return this; }()),
						{
							binary: void(0),
							text: void(0),
							lines: void(0)
						}
					);

					//	We provide the optional operations read.binary and read.text, even though they are semantically equivalent to read(),
					//	for two reasons. First, they
					//	allow callers to use object detection to determine the capabilities of this resource. Second, they make it possible for
					//	callers to use these methods without having access to the module Streams object (which would be used as an argument to
					//	read()). This is why we do not provide the same sort of API for String and XML, because those global objects will be
					//	accessible to every caller.

					if (binary) {
						this.read.binary = function() {
							return binary();
						}
					}

					if (text) {
						this.read.text = function() {
							return text();
						};

						this.read.lines = function() {
							var stream = text();
							return stream.readLines.apply(stream,arguments);
						};
					}

					// TODO: Resources are not really conceptually immuntable, since they can be written, so they should probably not
					// cache length and modified
					if (p.hasOwnProperty("length")) {
						Object.defineProperty(this,"length",{
							get: loader.$api.Function.memoized(function() {
								if (typeof(p.length) == "number") {
									return p.length;
								} else if (typeof(p.length) == "undefined" && binary) {
									return _streams.readBytes(binary().java.adapt()).length;
								}
							}),
							enumerable: true
						})
					}
					// if (typeof(p.length) == "number") {
					// 	this.length = p.length;
					// } else if (typeof(p.length) == "undefined" && binary) {
					// 	Object.defineProperty(this, "length", {
					// 		get: function() {
					// 			//	TODO	use something from $api
					// 			if (!arguments.callee.called) {
					// 				arguments.callee.called = { returns: _java.readBytes(binary().java.adapt()).length };
					// 			}
					// 			return arguments.callee.called.returns;
					// 		},
					// 		enumerable: true
					// 	});
					// }

					// if (typeof(p.modified) == "object") {
					// 	this.modified = p.modified;
					// }
					if (p.hasOwnProperty("modified")) {
						this.modified = void(0);
						Object.defineProperty(this,"modified",{
							get: loader.$api.Function.memoized(function() {
								return p.modified;
							}),
							enumerable: true
						});
					}

					if (p.write) {
						var writeBinary = (function() {
							if (p.write.binary) {
								return function(mode) {
									return p.write.binary(mode);
								}
							}
						})();

						var writeText = (function() {
							if (p.write.text) {
								return function(mode) {
									return p.write.text(mode);
								};
							} else if (p.write.binary) {
								return function(mode) {
									return p.write.binary(mode).character();
								};
							}
						})();

						this.write = function(dataOrType,mode) {
							if (!mode) mode = {};
							if (dataOrType == loader.io.Streams.binary && writeBinary) {
								return writeBinary(mode);
							} else if (dataOrType == loader.io.Streams.text && writeText) {
								return writeText(mode);
							} else if (dataOrType.java && dataOrType.java.adapt && loader.java.isJavaType(Packages.java.io.InputStream)(dataOrType.java.adapt())) {
								var stream = writeBinary(mode);
								loader.io.Streams.binary.copy(dataOrType,stream);
								stream.close();
							} else if (dataOrType.java && dataOrType.java.adapt && loader.java.isJavaType(Packages.java.io.Reader)(dataOrType.java.adapt())) {
								stream = writeText(mode);
								loader.io.Streams.text.copy(dataOrType,stream);
								stream.close();
							} else if (typeof(dataOrType) == "string" && writeText) {
								var writer = writeText(mode);
								writer.write(dataOrType);
								writer.close();
							} else if (typeof(dataOrType) == "object" && loader.java.isJavaType(Packages.java.util.Properties)(dataOrType)) {
								var comments = (mode && mode.comments) ? mode.comments : null;
								var writer = writeText(mode);
								dataOrType.store(writer.java.adapt(), comments);
								writer.close();
							} else if (String(typeof(dataOrType)) == "xml" && writeText) {
								var writer = writeText(mode);
								writer.write(dataOrType.toXMLString());
								writer.close();
							} else {
								throw new TypeError("No compatible write mode, trying to write: " + dataOrType);
							}
						};

						if (!this.java) this.java = {};
						var self = this;
						if (!this.java.adapt) this.java.adapt = function(path) {
							return new JavaAdapter(
								Packages.inonit.script.engine.Code.Loader.Resource,
								new function() {
									["getURI","getSourceName","getInputStream","getLength","getLastModified"].forEach(function(methodName) {
										this[methodName] = function() {
											throw new Error("Unimplemented: " + methodName);
										};
									},this);

									this.getURI = function() {
										// TODO: Unclear what this is doing; does this object represent just one file? Seems like no
										return Packages.inonit.script.engine.Code.Loader.URI.script(
											"expression.js",
											path
										)
									}

									this.getSourceName = function() {
										return (self.name) ? self.name : null;
									}

									this.getInputStream = function() {
										if (!self.read || !self.read.binary) throw new Error("Cannot read " + self);
										return self.read.binary().java.adapt();
									}
								}
							);
						}
					}
				}
			);
			/** @type { slime.jrunscript.runtime.Exports["Resource"] } */
			return rv;
		})(loader.Resource);

		loader.Resource = Resource;

		// //	Convert a Java inonit.script.engine.Code.Loader.Resource to a resource
		// //	TODO	should this logic be pushed into loader.io? Probably
		// var JavaResource = function(_file,path) {
		// 	var rv = loader.Resource.call(this,parameter);
		// 	rv.name = String(_file.getSourceName());
		// 	Object.defineProperty(
		// 		rv,
		// 		"modified",
		// 		new function() {
		// 			this.get = function() {
		// 				var _modified = _file.getLastModified();
		// 				if (_modified) return new Date( Number(_modified.getTime()) );
		// 			};
		// 			this.enumerable = true;
		// 		}
		// 	)
		// 	rv.java = {
		// 		adapt: function() {
		// 			return _file;
		// 		}
		// 	}
		// 	return rv;
		// };
		// Resource.toJavaResource = function(resource,path) {
		// 	if (!resource) return null;
		// 	//	TODO	cheat by storing Code.Loader.Resource for resources created by this source file. Design smell that we
		// 	//			need to convert back and forth between Java and script versions
		// 	if (resource.java && resource.java.adapt) return resource.java.adapt();
		// 	return new JavaAdapter(
		// 		Packages.inonit.script.engine.Code.Loader.Resource,
		// 		new function() {
		// 			["getURI","getSourceName","getInputStream","getLength","getLastModified"].forEach(function(methodName) {
		// 				this[methodName] = function() {
		// 					throw new Error("Unimplemented: " + methodName);
		// 				};
		// 			},this);
		//
		// 			this.getURI = function() {
		// 				// TODO: Unclear what this is doing; does this object represent just one file? Seems like no
		// 				return Packages.inonit.script.engine.Code.Loader.URI.script(
		// 					"expression.js",
		// 					path
		// 				)
		// 			}
		//
		// 			this.getSourceName = function() {
		// 				return (resource.name) ? resource.name : null;
		// 			}
		//
		// 			this.getInputStream = function() {
		// 				if (!resource.read) throw new Error("Cannot read " + resource);
		// 				return resource.read.binary().java.adapt();
		// 			}
		// 		}
		// 	)
		// };

		loader.Loader = (function(was) {
			/**
			 * @this { slime.Loader & { java: any } }
			 * @param { slime.jrunscript.runtime.Loader.Source } p
			 */
			var rv = function(p) {
				if (!p) throw new TypeError("source argument required for Loader.");
				if (p.zip) {
					if (p.zip._file) {
						p._source = Packages.inonit.script.engine.Code.Loader.zip(p.zip._file);
					} else if (p.zip.resource) {
						p._source = Packages.inonit.script.engine.Code.Loader.zip(p.zip.resource.java.adapt(p.zip.resource.name));
					}
				} else if (p._file && p._file.isDirectory()) {
					p._source = Packages.inonit.script.engine.Code.Loader.create(p._file);
				} else if (p._url) {
					//	TODO	no known test coverage
					p._source = Packages.inonit.script.engine.Code.Loader.create(p._url);
				}
				if (p._source) {
					p.get = function(path) {
						var _file = p._source.getFile(path);
						if (!_file) return null;
						return {
							_loaded: {
								resource: _file,
								path: path
							},
							read: void(0)
						};
					};
					p.child = function(prefix) {
						return {
							_source: p._source.child(prefix)
						}
					};
					if (p._source.getEnumerator()) {
						p.list = function(prefix) {
							var _paths = p._source.getEnumerator().list(prefix);
							var rv = [];
							if (!_paths) return rv;
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
							var rv = {};
							if (typeof(resource.length) != "undefined") rv.length = resource.length;
							if (typeof(resource.name) != "undefined") rv.name = resource.name;
							if (typeof(resource.string) != "undefined") rv.string = resource.string;
							if (typeof(resource.type) != "undefined") rv.type = resource.type;
							if (typeof(resource.read) == "function") {
								rv.read = {
									binary: resource.read.binary,
									string: void(0)
								}
							}
							//var rv = new loader.Resource(resource);
							if (!rv.name) {
								rv.name = p.resources.toString() + "!" + String(path);
							}
							if (!rv.type) {
								rv.type = getTypeFromPath(path);
							}
							// rv.java = {
							// 	InputStream: function() {
							// 		return resource.read.binary().java.adapt()
							// 	}
							// };
							// rv.resource = rv;
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
				p.Resource = loader.Resource;
				was.apply(this,arguments);
				var source = this.source;
				var self = this;
				this.java = {
					adapt: function() {
						if (source["_source"]) return source["_source"];
						return new JavaAdapter(
							Packages.inonit.script.engine.Code.Loader,
							new function() {
								this.getFile = function(path) {
									var resource = self.get(path);
									// TODO: Below inserted hastily, not sure whether it makes sense
									if (!resource) return null;
									return resource["java"].adapt(path);
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
			Object.assign(rv, was);
			return rv;
		})(loader.Loader);

		loader.classpath = new (function(_classpath /* Loader.Classes.Interface */) {
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
					_classpath.add(Packages.inonit.script.engine.Code.Loader.create(p._file));
				} else if (p._file && p._file.exists() && !p._file.isDirectory()) {
					//	Currently can be used to add .jar directly to classpath through jsh.loader.java.add
					//	TODO	determine whether this should be switched to jar._file; used by servlet plugin to put Tomcat classes
					//			in classpath
					_classpath.add(Packages.inonit.script.engine.Code.Loader.create(p._file));
				} else if (p.slime) {
					if (p.slime.loader) {
						_classpath.add(p.slime.loader.java.adapt().child("$jvm/classes"));
					} else {
						throw new Error();
					}
				} else if (p.jar) {
					if (p.jar._file) {
						if (Packages.java.lang.System.getenv("SLIME_JAVA_SERVICELOADER_WORKS")) {
							_classpath.add(Packages.inonit.script.engine.Code.Loader.zip(
								Packages.inonit.script.engine.Code.Loader.Resource.create(p.jar._file)
							));
							// _classpath.add(Packages.inonit.script.engine.Code.Loader.create(p.jar._file));
						} else {
							_classpath.addJar(p.jar._file);
						}
					} else if (p.jar.resource) {
						_classpath.add(Packages.inonit.script.engine.Code.Loader.zip(p.jar.resource.java.adapt(p.jar.resource.name)));
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
		})($loader.getClasspath());

		loader.$api.jrunscript = {
			Properties: {
				codec: {
					object: {
						encode: function(properties) {
							var rv = new Packages.java.util.Properties();
							for (var x in properties) {
								rv.setProperty(x, properties[x]);
							}
							return rv;
						},
						decode: function(_properties) {
							var _keys = _properties.propertyNames();
							/** @type { slime.$api.jrunscript.Properties } */
							var rv = {};
							while(_keys.hasMoreElements()) {
								var name = String(_keys.nextElement());
								var value = String(_properties.getProperty(name));
								rv[name] = value;
							}
							return rv;
						}
					}
				}
			}
		}

		//	TODO	come up with a better way to do this; adding a property to loader would ideally add it here
		return {
			run: loader.run,
			file: loader.file,
			value: loader.value,
			namespace: loader.namespace,
			$platform: loader.platform,
			$api: loader.$api,
			Loader: loader.Loader,
			Resource: loader.Resource,
			mime: loader.mime,
			io: loader.io,
			java: loader.java,
			classpath: loader.classpath,
			typescript: loader.typescript
		};
	}
//@ts-ignore
)($javahost,$bridge,Packages,JavaAdapter, (function() { return this.XML })(),$loader)