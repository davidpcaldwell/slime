//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
//	TODO	Redefine JavaAdapter to be slime.jrunscript.JavaAdapter and XML to be slime.external.e4x.XMLConstructor
	/**
	 * @param { slime.jrunscript.runtime.$javahost } $javahost
	 * @param { slime.jrunscript.runtime.java.context.Engine } $bridge
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { any } XML
	 * @param { slime.jrunscript.native.inonit.script.engine.Loader } $loader
	 * @returns { slime.jrunscript.runtime.Exports }
	 */
	function($javahost,$bridge,Packages,JavaAdapter,XML,$loader) {
		/** @type { slime.jrunscript.native.inonit.script.runtime.io.Streams } */
		var _streams = new Packages.inonit.script.runtime.io.Streams();

		/**
		 *
		 * @param { slime.$api.mime.Export["Type"]["fromName"] } fromNameWas
		 * @param { slime.$api.mime.Export["Type"]["codec"]["declaration"] } codec
		 * @returns { slime.jrunscript.runtime.mime.FromName }
		 */
		var mimeTypeFromNameDecorate = function(fromNameWas,codec) {
			/** @type { slime.jrunscript.runtime.mime.FromName["java"]["URLConnection"] } */
			var guess_URLConnection = function(p) {
				var _rv = Packages.java.net.URLConnection.getFileNameMap().getContentTypeFor(p.name);
				if (!_rv) return void(0);
				return codec.decode(String(_rv));
			};

			var rv = function(p) {
				var rv = fromNameWas.apply(this,arguments);
				if (typeof(rv) != "undefined") return rv;
				rv = guess_URLConnection({ name: p });
				return rv;
			};
			rv.slime = fromNameWas;
			rv.java = {
				URLConnection: guess_URLConnection
			};
			return rv;
		}

		var slime = (
			/**
			 * @returns { slime.runtime.Exports }
			 */
			function() {
				/** @type { slime.runtime.Engine } */
				var $engine = {
					debugger: $javahost.debugger,
					execute: function(script,scope,target) {
						return $javahost.script(script.name,script.js,scope,target);
					},
					MetaObject: void(0)
				};
				//	TODO	decorate global Error objects; see jrunscript/host/module.js

				(function() {
					if ($javahost.MetaObject) $engine.MetaObject = $javahost.MetaObject;
				})();
				/** @type { slime.runtime.scope.Deployment } */
				var $slime = {
					getRuntimeScript: function(path) {
						return {
							name: "slime://loader/" + path,
							js: String($loader.getLoaderCode(path))
						};
					}
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
							if (!$slime.flags) $slime.flags = {};
							$slime.flags[match[1]] = value;
						}
					}
				}
				/** @type { slime.runtime.Scope } */
				var scope = {
					$engine: $engine,
					$slime: $slime,
					Packages: Packages
				};

				/** @type { slime.runtime.Exports } */
				var rv = $javahost.eval("slime://loader/expression.js",String($loader.getLoaderCode("expression.js")),{
					scope: scope
				},null);

				rv.$api.mime.Type.fromName = mimeTypeFromNameDecorate(rv.$api.mime.Type.fromName, rv.$api.mime.Type.codec.declaration);

				var _coffeescript = $loader.getCoffeeScript();
				if (_coffeescript) {
					var target = {};
					$engine.execute({ name: "coffee-script.js", js: String(_coffeescript) }, {}, target);
					rv.compiler.update(function(was) {
						return rv.$api.fp.switch([
							was,
							rv.$api.scripts.Compiler.from.simple({
								accept: rv.$api.scripts.Code.isMimeType("application/vnd.coffeescript"),
								name: function(code) { return code.name; },
								read: function(code) { return code.read(); },
								compile: target.CoffeeScript.compile
							})
						])
					})
				}

				//	Implement TypeScript using Java-based TypeScript invocation
				//
				//	In jsh, this implementation is replaced later in the jsh loader by prepending a slime.jrunscript.shell-based
				//	implementation to the script compiler. In servlets, this implementation (for now) continues to be used.
				//
				//	A better solution would be to refactor slime.jrunscript.shell to extract a basic interface to subprocesses
				//	and provide that as part of the jrunscript runtime; then it could be used here to replace TypeScript in all
				//	cases.

				var _typescript = $loader.getTypescript();
				if (_typescript) {
					rv.compiler.update(function(was) {
						return rv.$api.fp.switch([
							was,
							rv.$api.scripts.Compiler.from.simple({
								accept: rv.$api.scripts.Code.isMimeType("application/x.typescript"),
								name: function(code) { return code.name; },
								read: function(code) { return code.read(); },
								compile: function(code) { return String(_typescript.compile(code)); }
							})
						])
					});
				}

				return rv;
			}
		)();

		var $exports_java = slime.file(
			new slime.Resource({
				name: "slime://loader/jrunscript/java.js",
				read: slime.Resource.ReadInterface.string(String($loader.getLoaderCode("jrunscript/java.js")))
			}), {
				engine: $bridge,
				classpath: $loader.getClasspath()
			}
		);

		/** @type { slime.jrunscript.runtime.io.Exports } */
		var $exports_io = slime.file(
			new slime.Resource({
				name: "slime://loader/jrunscript/io.js",
				read: slime.Resource.ReadInterface.string(String($loader.getLoaderCode("jrunscript/io.js")))
			}), {
				_streams: _streams,
				api: {
					java: $exports_java,
					Resource: slime.Resource
				}
			}
		);

		var getTypeFromPath = function(path) {
			return slime.$api.mime.Type.fromName(path);
		}

		/**
		 *
		 * @param { slime.jrunscript.runtime.old.resource.HistoricSupportedDescriptor } o
		 * @returns { o is slime.jrunscript.runtime.old.resource.DeprecatedStreamDescriptor }
		 */
		var isStreamDescriptor = function(o) {
			return o["stream"] && o["stream"]["binary"]
		};

		/**
		 *
		 * @param { slime.jrunscript.runtime.old.resource.DeprecatedStreamDescriptor } o
		 * @returns { slime.jrunscript.runtime.old.resource.Descriptor }
		 */
		var fromStreamDescriptor = function(o) {
			return {
				type: o.type,
				name: o.name,
				read: {
					binary: (function(stream) {
						var _bytes;

						return function() {
							if (!_bytes) {
								_bytes = stream.java.array();
							}
							return $exports_io.InputStream.java(new Packages.java.io.ByteArrayInputStream(_bytes));
						}
					})(o.stream.binary)
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.runtime.old.resource.HistoricSupportedDescriptor } o
		 * @returns { o is slime.jrunscript.runtime.old.resource.LoadedDescriptor }
		 */
		var isLoadedDescriptor = function(o) {
			return o["_loaded"];
		};

		/**
		 *
		 * @param { slime.resource.Descriptor | slime.jrunscript.runtime.old.resource.Descriptor } p
		 * @returns { p is slime.jrunscript.runtime.old.resource.Descriptor }
		 */
		var isJrunscriptDescriptor = function(p) {
			return (p.read && (p.read["binary"] || p.read["text"])) || p["write"];
		}

		/** @type { slime.jrunscript.runtime.Exports["Resource"] } */
		var Resource = (function(was) {
			var rv = (
				/**
				 * @param { slime.jrunscript.runtime.old.resource.HistoricSupportedDescriptor } p
				 * @constructor
				 */
				function(p) {
					if (Object.keys(p).length == 2 && p.type && p.name) {
						debugger;
					}

					if (isStreamDescriptor(p)) {
						return new Resource(fromStreamDescriptor(p));
					}

					if (isLoadedDescriptor(p)) {
						if (!p.read) p.read = {};
						p.read.binary = function() {
							return $exports_io.InputStream.java(p._loaded.resource.getInputStream());
						};
					}

					if (p["string"]) {
						throw new TypeError();
					}

					if (isJrunscriptDescriptor(p) && !p.read) {
						slime.$api.deprecate(function() {
							//	'read' is mandatory in TypeScript but not present, why?
							//	TODO	leads to a lot of extra && p.read && p.read.foo below
						})();
					}

					var binary = (function() {
						if (isJrunscriptDescriptor(p) && p.read && p.read.binary) {
							return function() {
								return p.read.binary();
							}
						}
					})();

					// TODO: Probably should implement this method if the argument provides a string or read.string also
					var text = (function() {
						if (isJrunscriptDescriptor(p) && p.read && p.read.text) {
							return function() {
								return p.read.text();
							}
						}
						if (p.read && p.read.string) {
							return function() {
								return $exports_io.Reader.java(new Packages.java.io.StringReader(p.read.string()));
							}
						}
						if (isJrunscriptDescriptor(p) && p.read && p.read.binary) {
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
					if (isLoadedDescriptor(p)) {
						if (!this.type) {
							this.type = slime.$api.mime.Type.fromName(p._loaded.path);
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
							/** @param { string } path */
							adapt: function(path) {
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

					/** @type { slime.js.Cast<slime.Resource["read"]> } */
					var cast = slime.$api.fp.cast.unsafe;

					this.read = cast(this.read);

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
									if (mode == $exports_io.Streams.binary) return binary();
									if (mode == Packages.java.util.Properties) return _properties(binary().java.adapt());
								}
								if (text) {
									if (mode == $exports_io.Streams.text) return text();
									if (mode == String) return text().asString();
									if (mode == Packages.java.util.Properties) return _properties(text().java.adapt());
									if (mode == global.XML) return slime.$api.deprecate(function() {
										return XML(text().asString())
									})();
								}
								var parameters = (function() {
									if (!p) return String(p);
									if (typeof(p) == "object") return String(p) + " with keys: " + Object.keys(p);
									return String(p);
								})();
								debugger;
								throw new TypeError("No compatible read() mode specified: parameters = " + parameters + " binary=" + binary + " text=" + text + " argument was " + mode
									+ " Streams.binary " + (mode == $exports_io.Streams.binary)
									+ " Streams.text " + (mode == $exports_io.Streams.text)
									+ " XML " + (mode == global.XML)
									+ " String " + (mode == String)
								);
							};
						})(this.read, function() { return this; }()),
						{
							binary: void(0),
							text: void(0),
							string: void(0),
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

					// TODO: Resources are not really conceptually immutable, since they can be written, so they should probably not
					// cache length and modified
					if (isJrunscriptDescriptor(p) && Object.prototype.hasOwnProperty.call(p, "length")) {
						Object.defineProperty(this,"length",{
							get: slime.$api.fp.impure.Input.memoized(function() {
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
					if (isJrunscriptDescriptor(p) && Object.prototype.hasOwnProperty.call(p, "modified")) {
						this.modified = void(0);
						Object.defineProperty(this,"modified",{
							get: slime.$api.fp.impure.Input.memoized(function() {
								return p.modified;
							}),
							enumerable: true
						});
					}

					if (isJrunscriptDescriptor(p) && p.write) {
						var writeBinary = (function() {
							if (p.write.binary) {
								return function(mode) {
									return p.write.binary(mode);
								}
							}
						})();

						/**
						 * @returns { slime.jrunscript.runtime.io.Writer }
						 */
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

						//	TODO	a lot of type narrowing, etc., needed here to get the type checking in order
						/** @type { slime.jrunscript.runtime.old.Resource["write"]} */
						//@ts-ignore
						this.write = function(dataOrType,mode) {
							if (typeof(dataOrType) == "undefined") throw new TypeError("Cannot write 'undefined'");
							if (!mode) mode = {};
							if (dataOrType == $exports_io.Streams.binary && writeBinary) {
								return writeBinary(mode);
							} else if (dataOrType == $exports_io.Streams.text && writeText) {
								return writeText(mode);
							} else if (dataOrType.java && dataOrType.java.adapt && $exports_java.isJavaType(Packages.java.io.InputStream)(dataOrType.java.adapt())) {
								var stream = writeBinary(mode);
								$exports_io.Streams.binary.copy(dataOrType,stream);
								stream.close();
							} else if (dataOrType.java && dataOrType.java.adapt && $exports_java.isJavaType(Packages.java.io.Reader)(dataOrType.java.adapt())) {
								var writer = writeText(mode);
								$exports_io.Streams.text.copy(dataOrType,writer);
								writer.close();
							} else if (typeof(dataOrType) == "string" && writeText) {
								var writer = writeText(mode);
								writer.write(dataOrType);
								writer.close();
							} else if (typeof(dataOrType) == "object" && $exports_java.isJavaType(Packages.java.util.Properties)(dataOrType)) {
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

						var self = this;
						if (!this.java) this.java = {
							adapt: function(path) {
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
						};
					}
				}
			);
			/** @type { slime.jrunscript.runtime.Exports["Resource"] } */
			return Object.assign(
				rv,
				{
					ReadInterface: was.ReadInterface
				}
			);
		})(slime.Resource);

		var $exports_Resource = Resource;

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

		/** @typedef { slime.jrunscript.runtime.internal.Source } InternalSource */

		/** @type { (p: InternalSource) => p is slime.jrunscript.runtime.internal.ZipFileSource } */
		function isZipFileSource(p) {
			return p["zip"] && p["zip"]["_file"];
		}

		/** @type { (p: InternalSource) => p is slime.jrunscript.runtime.internal.ZipResourceSource } */
		function isZipResourceSource(p) {
			return p["zip"] && p["zip"]["resource"];
		}

		/** @type { (p: InternalSource) => p is slime.jrunscript.runtime.internal.JavaFileSource } */
		function isJavaFileSource(p) {
			return p["_file"];
		}

		/** @type { (p: InternalSource) => p is slime.jrunscript.runtime.internal.JavaCodeLoaderSource } */
		function isJavaCodeLoaderSource(p) {
			return p["_source"];
		}

		/** @type { (_source: slime.jrunscript.native.inonit.script.engine.Code.Loader) => slime.old.loader.Source<slime.jrunscript.runtime.internal.JavaCodeLoaderSource> } */
		function adaptCodeLoader(_source) {
			return {
				get: function(path) {
					var _file = _source.getFile(path);
					if (!_file) return null;
					return {
						_loaded: {
							resource: _file,
							path: path
						},
						read: void(0)
					};
				},
				child: function(prefix) {
					return {
						_source: _source.child(prefix)
					}
				},
				list: (_source.getEnumerator()) ? function(prefix) {
					var _paths = _source.getEnumerator().list(prefix);
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
				} : void(0),
				toString: function() {
					return "Java loader: " + _source.toString();
				},
				Resource: $exports_Resource
			}
		}

		/** @type { (p: slime.jrunscript.runtime.internal.JavaCodeLoaderSource) => slime.old.loader.Source<slime.jrunscript.runtime.internal.JavaCodeLoaderSource> } */
		function adaptJavaCodeLoaderSource(p) {
			return adaptCodeLoader(p._source);
		}

		/** @type { (p: slime.jrunscript.runtime.internal.ZipFileSource) => slime.old.loader.Source } */
		function adaptZipFileSource(p) {
			return adaptCodeLoader(Packages.inonit.script.engine.Code.Loader.zip(p.zip._file));
		}

		/** @type { (p: slime.jrunscript.runtime.internal.ZipResourceSource) => slime.old.loader.Source } */
		function adaptZipResourceSource(p) {
			return adaptCodeLoader(Packages.inonit.script.engine.Code.Loader.zip(p.zip.resource.java.adapt(p.zip.resource.name)));
		}

		/** @type { (p: slime.jrunscript.runtime.internal.JavaFileSource) => slime.old.loader.Source } */
		function adaptJavaFileSource(p) {
			return adaptCodeLoader(Packages.inonit.script.engine.Code.Loader.create(p._file));
		}

		/** @type { (p: InternalSource) => p is slime.jrunscript.runtime.internal.DeprecatedResourcesSource } */
		function isResourcesSource(p) {
			return p["resources"];
		}

		/** @type { (p: slime.jrunscript.runtime.internal.DeprecatedResourcesSource) => slime.old.loader.Source } */
		function adaptResourcesSource(p) {
			return {
				get: function(path) {
					var resource = p.resources.get(String(path));
					if (!resource) return null;
					var rv = {};
					if (typeof(resource.length) != "undefined") rv.length = resource.length;
					if (typeof(resource.name) != "undefined") rv.name = resource.name;
					if (typeof(resource.string) != "undefined") rv.string = resource.string;
					if (typeof(resource.type) != "undefined") rv.type = resource.type;
					if (typeof(resource.read) == "function" || (typeof(resource.read) == "object" && resource.read && typeof(resource.read.binary) == "function")) {
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
				},
				child: p.child || function(prefix) {
					return {
						resources: {
							get: function(path) {
								return p.resources.get(prefix + path);
							}
						}
					}
				},
				Resource: $exports_Resource
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.runtime.internal.Source } p
		 * @returns { slime.old.loader.Source<slime.jrunscript.runtime.internal.CustomSource> }
		 */
		function adaptLoaderArgument(p) {
			if (isZipFileSource(p)) return adaptZipFileSource(p);
			if (isZipResourceSource(p)) return adaptZipResourceSource(p);
			if (isJavaFileSource(p)) return adaptJavaFileSource(p);
			if (isJavaCodeLoaderSource(p)) return adaptJavaCodeLoaderSource(p);
			if (isResourcesSource(p)) return slime.$api.deprecate(adaptResourcesSource)(p);
			//	TODO	no known static or dynamic uses or test coverage
			if (p["_url"]) return slime.$api.deprecate(adaptCodeLoader)(Packages.inonit.script.engine.Code.Loader.create(p["_url"]));

			//	TODO	this line was present previously and makes jrunscript file Loaders work, but does not make a lot of sense
			//			at the moment
			p.Resource = $exports_Resource;
			return p;
		}

		/**
		 *
		 * @param { slime.old.loader.Source } source
		 * @returns { source is slime.jrunscript.native.inonit.script.engine.Code.Loader }
		 */
		var isJavaCodeLoader = function(source) {
			var type = $bridge.toNativeClass(Packages.inonit.script.engine.Code.Loader);
			return type.isInstance(source);
		}

		/**
		 *
		 * @param { slime.old.Loader } self
		 * @returns { slime.jrunscript.native.inonit.script.engine.Code.Loader }
		 */
		var toJavaCodeLoader = function(self) {
			if (isJavaCodeLoader(self.source)) return self.source;
			return new JavaAdapter(
				Packages.inonit.script.engine.Code.Loader,
				new function() {
					this.getFile = function(path) {
						var resource = self.get(path);
						// TODO: Below inserted hastily, not sure whether it makes sense
						if (!resource) return null;
						//	TODO	The 'path' argument below is probably erroneous and instead should be a no-arg call
						return resource["java"].adapt(path);
					};

					this.getLocator = function() {
						return null;
					};

					this.getEnumerator = function() {
						throw new Error("Unimplemented: getEnumerator");
					}
				}
			)
		}

		var $exports_Loader = (
			/**
			 *
			 * @param { slime.runtime.Exports["old"]["Loader"] } was
			 * @returns
			 */
			function(was) {
				/**
				 * @type { slime.runtime.exports.Old["Loader"] }
				 */
				var rv = Object.assign(
					/**
					 * @this { slime.old.Loader }
					 */
					function(p) {
						if (!p) throw new TypeError("source argument required for Loader.");

						//	Satisfy TypeScript
						this.source = void(0);
						this.run = void(0);
						this.value = void(0);
						this.file = void(0);
						this.module = void(0);
						this.script = void(0);
						this.factory = void(0);
						this.Child = void(0);
						this.get = void(0);
						this.toSynchronous = void(0);

						var source = adaptLoaderArgument(p);

						was.call(this,source);
					},
					was
				);
				return rv;
			}
		)(slime.old.Loader);

		var $exports_classpath = (
			/**
			 *
			 * @param { slime.jrunscript.native.inonit.script.engine.Loader.Classes.Interface } _classpath
			 */
			function(_classpath) {
				/** @type { (entry: slime.jrunscript.runtime.ClasspathEntry) => entry is slime.jrunscript.runtime.JavaFileClasspathEntry } */
				var isJavaFileClasspathEntry = function(entry) { return Boolean(entry["_file"]); }
				/** @type { (entry: slime.jrunscript.runtime.ClasspathEntry) => entry is slime.jrunscript.runtime.SlimeClasspathEntry } */
				var isSlimeClasspathEntry = function(entry) { return Boolean(entry["slime"]); }
				/** @type { (entry: slime.jrunscript.runtime.ClasspathEntry) => entry is slime.jrunscript.runtime.JarFileClasspathEntry } */
				var isJarFileClasspathEntry = function(entry) { return Boolean(entry["jar"] && entry["jar"]["_file"]); }
				/** @type { (entry: slime.jrunscript.runtime.ClasspathEntry) => entry is slime.jrunscript.runtime.JarResourceClasspathEntry } */
				var isJarResourceClasspathEntry = function(entry) { return Boolean(entry["jar"] && entry["jar"]["resource"]); }
				/** @type { (entry: slime.jrunscript.runtime.ClasspathEntry) => entry is slime.jrunscript.runtime.SrcClasspathEntry } */
				var isSrcClasspathEntry = function(entry) { return Boolean(entry["src"]); }

				return {
					toString: function() {
						return String(_classpath);
					},
					setAsThreadContextClassLoaderFor: function(_thread) {
						_classpath.setAsThreadContextClassLoaderFor(_thread);
					},
					getClass: function(name) {
						return _classpath.getClass(name);
					},
					/** @type { slime.jrunscript.runtime.Exports["classpath"]["add"] } */
					add: function(p) {
						if (isJavaFileClasspathEntry(p) && p._file.isDirectory()) {
							_classpath.add(Packages.inonit.script.engine.Code.Loader.create(p._file));
						} else if (isJavaFileClasspathEntry(p) && p._file.exists() && !p._file.isDirectory()) {
							//	Currently can be used to add .jar directly to classpath through jsh.loader.java.add
							//	TODO	determine whether this should be switched to jar._file; used by servlet plugin to put Tomcat classes
							//			in classpath
							_classpath.add(Packages.inonit.script.engine.Code.Loader.create(p._file));
						} else if (isJavaFileClasspathEntry(p) && !p._file.exists()) {
							//	do nothing
						} else if (isSlimeClasspathEntry(p)) {
							if (p.slime.loader) {
								_classpath.add(toJavaCodeLoader(p.slime.loader).child("$jvm/classes"));
							} else {
								throw new Error();
							}
						} else if (isJarFileClasspathEntry(p)) {
							//	TODO	undocumented
							if (Packages.java.lang.System.getenv("SLIME_JAVA_SERVICELOADER_WORKS")) {
								_classpath.add(Packages.inonit.script.engine.Code.Loader.zip(
									Packages.inonit.script.engine.Code.Loader.Resource.create(p.jar._file)
								));
								// _classpath.add(Packages.inonit.script.engine.Code.Loader.create(p.jar._file));
							} else {
								_classpath.addJar(p.jar._file);
							}
						} else if (isJarResourceClasspathEntry(p)) {
							//	TODO	not sure what type p.jar.resource is
							_classpath.add(Packages.inonit.script.engine.Code.Loader.zip(p.jar.resource.java.adapt(p.jar.resource.name)));
						} else if (isSrcClasspathEntry(p)) {
							if (p.src.loader) {
								_classpath.add(_classpath.compiling(toJavaCodeLoader(p.src.loader)));
							} else {
								throw new Error();
							}
						} else {
							throw new Error("No relevant handler for add(" + p + ")");
						}
					}
				}
			}
		)($loader.getClasspath());

		/** @type { slime.jrunscript.runtime.Exports["jrunscript"] } */
		var jrunscript = {
			loader: {
				/** @type { slime.jrunscript.runtime.Exports["jrunscript"]["loader"]["from"] } */
				from: {
					java: function(_loader) {
						return {
							toString: function() {
								return "[runtime/jrunscript].jrunscript.loader.from: " + _loader.toString();
							},
							get: function(path) {
								var _file = _loader.getFile(path.join("/"));
								if (!_file) return slime.$api.fp.Maybe.from.nothing();
								return slime.$api.fp.Maybe.from.some(_file)
							},
							list: (_loader.getEnumerator()) ? function(path) {
								var prefix = (path.length) ? path.join("/") : "";
								var _list = _loader.getEnumerator().list(prefix);
								if (!_list) return slime.$api.fp.Maybe.from.nothing();
								var rv = Array.prototype.map.call(_list, function(x) { return String(x); }).map(function(string) {
									var folder = (string.substring(string.length-1) == "/");
									var name = (folder) ? string.substring(0,string.length-1) : string;
									var item = {
										name: name,
										resource: !folder,
										parent: folder
									}
									return item;
								});
								return slime.$api.fp.Maybe.from.some(rv);
							} : void(0),
							code: function(_resource) {
								var name = String(_resource.getSourceName());
								return {
									name: name,
									type: function() {
										return slime.$api.mime.Type.fromName(name);
									},
									read: function() {
										var _stream = _resource.getInputStream();
										return $exports_io.Streams.java.adapt(_stream).character().asString();
									}
								}
							}
						}
					}
				},
				entries: function(p) {
					return slime.$api.fp.pipe(
						slime.$api.fp.split({
							listing: slime.loader.synchronous.resources(p.filter),
							loader: slime.$api.fp.identity
						}),
						function(inputs) {
							return inputs.listing.map(
								jrunscript.entry.Loader.from.synchronous({
									loader: inputs.loader,
									map: p.map
								})
							);
						}
					);
				}
			},
			Resource: {
				from: {
					java: function(_resource) {
						return {
							read: function() {
								return $exports_io.Streams.java.adapt(_resource.getInputStream());
							},
							length: function() {
								var length = _resource.getLength();
								if (length === null) return slime.$api.fp.Maybe.from.nothing();
								return slime.$api.fp.Maybe.from.some(length.longValue());
							},
							modified: function() {
								var _date = _resource.getLastModified();
								return (_date) ? slime.$api.fp.Maybe.from.some(_date.getTime()) : slime.$api.fp.Maybe.from.nothing();
							}
						}
					}
				}
			},
			Entry: {
				mostRecentlyModified: function() {
					var CORRECT = slime.$api.fp.Maybe.from.some(true);
					var SWAP = slime.$api.fp.Maybe.from.some(false);
					var EQUAL = slime.$api.fp.Maybe.from.nothing();
					return function(array) {
						var entry = array[0];
						var other = array[1];
						var m1 = entry.resource.modified();
						var m2 = other.resource.modified();
						if (!m1.present && !m2.present) return EQUAL;
						if (!m1.present) return SWAP;
						if (!m2.present) return CORRECT;
						var eTime = m1.value;
						var oTime = m2.value;
						if (oTime < eTime) return CORRECT;
						if (oTime > eTime) return SWAP;
						return EQUAL;
					}
				}
			},
			entry: {
				Loader: {
					from: {
						synchronous: function(p) {
							/** @param { slime.runtime.loader.Location } resource */
							return function(resource) {
								var loaded = p.loader.get(resource.path.concat([resource.name]));
								if (loaded.present) return {
									path: resource.path,
									name: resource.name,
									resource: p.map(loaded.value)
								}
							};
						}
					}
				}
			}
		};

		/** @type { slime.jrunscript.runtime.Exports["$api"]} */
		var $api = Object.assign(slime.$api, { jrunscript: { io: $exports_io } });

		return (
			/** @returns { slime.jrunscript.runtime.Exports } */
			function() {
				return $api.fp.now(
					{
						run: slime.run,
						old: slime.old,
						compiler: slime.compiler,
						loader: slime.loader,
						file: slime.file,
						value: slime.value,
						namespace: slime.namespace,
						$platform: slime.$platform,
						$api: $api,

						Loader: $exports_Loader,
						Resource: $exports_Resource,

						java: $exports_java,
						io: $exports_io,
						classpath: $exports_classpath,

						jrunscript: jrunscript
					},
					$api.Object.defineProperty({
						name: "mime",
						descriptor: {
							get: $api.deprecate($api.fp.Thunk.value(slime.$api.mime))
						}
					})
				)
			}
		)();
	}
//@ts-ignore
)($javahost,$bridge,Packages,JavaAdapter, (function() { return this.XML })(),$loader)
