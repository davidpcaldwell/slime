//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.Platform } $platform
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.external.e4x.XMLListConstructor } XMLList
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.runtime.io.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.runtime.io.Exports> } $export
	 */
	function($platform,Packages,JavaAdapter,XMLList,$api,$context,$export) {
		var _java = $context._streams;

		var inputs = {
			line: {
				separator: function() {
					//	Should we use jrunscript/host module?
					return String(Packages.java.lang.System.getProperty("line.separator"));
				}
			},
			charset: function() {
				return String(Packages.java.nio.charset.Charset.defaultCharset().name());
			}
		};

		var Charset = (
			function() {
				/**
				 *
				 * @param { slime.jrunscript.native.java.nio.charset.Charset } _peer
				 * @return { slime.jrunscript.runtime.io.Charset }
				 */
				var wrap = function(_peer) {
					return {
						name: String(_peer.name()),
						java: {
							adapt: function() {
								return _peer;
							}
						}
					}
				};

				return {
					java: wrap,
					default: wrap(Packages.java.nio.charset.Charset.defaultCharset())
				};
			}
		)();

		/**
		 *
		 * @param { slime.jrunscript.native.java.io.InputStream } stream
		 * @returns
		 */
		var readToArrayBuffer = function(stream) {
			var _bytes = _java.readBytes(stream);
			var rv = new ArrayBuffer(_bytes.length);
			var i8 = new Int8Array(rv);
			for (var i=0; i<_bytes.length; i++) {
				i8[i] = _bytes[i];
			}
			return rv;
		}

		/**
		 * @type { slime.jrunscript.runtime.io.Exports["InputStream"]["java"] }
		 */
		function InputStream(peer) {
			/**
			 *
			 * @param { slime.jrunscript.runtime.io.reader.Configuration } [mode]
			 * @returns
			 */
			var character = function(mode) {
				if (!mode) mode = {
					charset: void(0),
					LINE_SEPARATOR: void(0)
				};
				if (!mode.charset) mode.charset = String(Packages.java.nio.charset.Charset.defaultCharset().name());
				var separator = mode.LINE_SEPARATOR;
				//	TODO	No unit test for this method currently; does it work?
				return Reader.java(new Packages.java.io.InputStreamReader(peer,mode.charset), {LINE_SEPARATOR: separator});
			};

			return {
				content: {
					string: {
						simple: function(charset) {
							var _reader = new Packages.java.io.InputStreamReader(peer, charset.java.adapt());
							return String(_java.readString(_reader));
						}
					},
					ArrayBuffer: {
						simple: function() {
							return readToArrayBuffer(peer)
						}
					}
				},
				close: function() {
					peer.close();
				},
				character: character,
				java: {
					adapt: function() {
						return peer;
					},
					array: function() {
						return _java.readBytes(peer);
					}
				}
			}
		}

		/** @type { slime.jrunscript.runtime.io.Exports["OutputStream"] } */
		function OutputStream(peer) {
			return {
				split: function(other) {
					var otherPeer = other.java.adapt();

					//	Handle Buffer special case, very dubious
					if (!otherPeer && other.writeBinary) {
						otherPeer = other.writeBinary.java.adapt();
					}

					return OutputStream(_java.split(peer,otherPeer))
				},
				character: function() {
					return Writer(new Packages.java.io.OutputStreamWriter(peer), void(0));
				},
				close: function() {
					peer.close();
				},
				java: {
					adapt: function() {
						return peer;
					}
				}
			}
		}

		/**
		 * @type { slime.jrunscript.runtime.io.Exports["Reader"] }
		 */
		var Reader = {
			stream: function(p) {
				var mode = p.configuration;
				if (!mode) mode = {
					charset: void(0),
					newline: void(0)
				};
				if (!mode.charset) mode.charset = Charset.default;
				var separator = mode.newline;
				//	TODO	No unit test for this method currently; does it work?
				return Reader.java(new Packages.java.io.InputStreamReader(p.stream.java.adapt(),mode.charset.java.adapt()), {LINE_SEPARATOR: separator});
			},
			java: function(peer,properties) {
				var readLines = Object.assign(
					/**
					 * @type { slime.jrunscript.runtime.io.Reader["readLines"] }
					 */
					function(callback,mode) {
						if (!mode) mode = {};
						//	TODO	should we retrieve properties from the jrunscript/host module, or is this sufficient?
						if (!mode.ending && properties && properties.LINE_SEPARATOR) mode.ending = properties.LINE_SEPARATOR;
						if (!mode.ending) mode.ending = inputs.line.separator();
						if (!mode.onEnd) mode.onEnd = function() { peer.close(); return void(0); }

						/** @type { string } */
						var read;
						var result;
						var more = true;
						while( more ) {
							read = String(_java.readLine(peer,mode.ending));
							var hasEnding = read.substring(read.length - mode.ending.length) == mode.ending;
							var line;
							if (!hasEnding) {
								//	eof was reached
								more = false;
								line = read;
							} else {
								line = read.substring(0,read.length-mode.ending.length);
							}
							result = callback( line );
							if (typeof(result) != "undefined") {
								break;
							}
						}
						if (typeof(result) == "undefined") {
							mode.onEnd.call(this);
						} else {
							mode.onEnd.call(this,result);
						}
						//@ts-ignore
						return result;
					},
					{
						UNIX: "\n",
						DOS: "\r\n"
					}
				);

				$api.deprecate(readLines, "UNIX");
				$api.deprecate(readLines, "DOS");

				return $api.Object.compose(
					{
						close: function() {
							peer.close();
						},
						readLines: readLines,
						asString: function() {
							var buffer = new Packages.java.io.StringWriter();
							_java.copy(
								peer,
								buffer
							);
							return String( buffer.toString() );
						},
						java: {
							adapt: function() {
								return peer;
							}
						}
					},
					($platform.e4x) ? {
						asXml: $api.deprecate(function() {
							var string = this.asString();
							var resource = new $context.api.Resource({
								read: {
									string: function() { return string; }
								}
							});
							return resource.read(XMLList);
						})
					} : {
					}
				);
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.native.java.io.Writer } peer
		 * @returns { slime.jrunscript.runtime.io.OldWriter }
		 */
		var OldWriter = function(peer) {
			/** @returns { string } */
			var getTypeof = function(value) {
				return typeof(value);
			};

			/** @type { (value: string | slime.external.e4x.Object) => value is slime.external.e4x.Object} */
			var isE4x = function(value) {
				return getTypeof(value) == "xml";
			}

			return {
				close: function() {
					peer.close();
				},
				write: function(string) {
					if ($platform.e4x && isE4x(string)) {
						$api.deprecate(function() {
							peer.write( string.toXMLString() );
							peer.flush();
						})();
					} else if (typeof(string) == "string") {
						peer.write( String(string) );
						peer.flush();
					} else {
						throw new TypeError("Attempt to unsupported type to writer: " + string);
					}
				},
				java: {
					adapt: function() {
						return peer;
					}
				}
			};
		}

		/**
		 *
		 * @param { slime.jrunscript.native.java.io.Writer } peer
		 * @param { string } newline
		 * @returns { slime.jrunscript.runtime.io.Writer }
		 */
		var Writer = function(peer,newline) {
			var old = OldWriter(peer);

			return {
				close: function() {
					old.close();
				},
				write: function(string) {
					old.write(string);
				},
				line: function(line) {
					old.write( line + newline );
				},
				java: {
					adapt: function() {
						return old.java.adapt();
					}
				}
			};
		};

		var Streams = (function() {
			return {
				binary: new function() {
					this.copy = function(from,to,mode) {
						var isJavaType = $context.api.java.isJavaType;
						/** @type { slime.jrunscript.native.java.io.InputStream } */
						var _r = (function() {
							if (isJavaType(Packages.java.io.InputStream)(from)) return from;
							var adapt = (from.java && from.java.adapt) ? from.java.adapt() : null;
							if (adapt && isJavaType(Packages.java.io.InputStream)(adapt)) return adapt;
						})();
						/** @type { slime.jrunscript.native.java.io.OutputStream } */
						var _w = (function() {
							if (isJavaType(Packages.java.io.OutputStream)(to)) return to;
							if (to.java && to.java.adapt && isJavaType(Packages.java.io.OutputStream)(to.java.adapt())) return to.java.adapt();
						})();
						if (mode) {
							_java.copy(_r,_w,false);
							if (mode.onFinish) {
								mode.onFinish(_r,_w);
							}
						} else {
							_java.copy(_r,_w);
						}
					}
				},

				text: new function() {
					this.copy = function(from,to) {
						//	TODO	unknown the cases in which this is called, but the below is a pretty scary implicit conversion
						var isJavaType = $context.api.java.isJavaType;
						if (
							from && from.java && from.java.adapt && isJavaType(Packages.java.io.Reader)(from.java.adapt())
							&& to && to.java && to.java.adapt && isJavaType(Packages.java.io.Writer)(to.java.adapt())
						) {
							_java.copy(
								from.java.adapt(),
								to.java.adapt()
							);
						}
					}
				},

				java: new function() {
					//	TODO	to get rid of these ignores, we'd need to rethink the relationship between the Packages types and
					//			the native types, which might be worth doing, but not doing it now
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.InputStream } */
					//@ts-ignore
					var isJavaInputStream = $context.api.java.isJavaType(Packages.java.io.InputStream);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.OutputStream } */
					//@ts-ignore
					var isJavaOutputStream = $context.api.java.isJavaType(Packages.java.io.OutputStream);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.Reader } */
					//@ts-ignore
					var isJavaReader = $context.api.java.isJavaType(Packages.java.io.Reader);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.Writer } */
					//@ts-ignore
					var isJavaWriter = $context.api.java.isJavaType(Packages.java.io.Writer);

					/**
					 * @type { slime.jrunscript.runtime.io.Exports["Streams"]["java"]["adapt"] }
					 */
					//	TODO	figure out tyoe safety here
					//@ts-ignore
					this.adapt = function(object) {
						if (false) {
							throw new Error("Unreachable.");
						} else if ($context.api.java.isJavaObject(object) && isJavaInputStream(object)) {
							return InputStream(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaOutputStream(object)) {
							return OutputStream(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaReader(object)) {
							return Reader.java(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaWriter(object)) {
							return OldWriter(object);
						} else {
							var type = (function() {
								if (object.getClass) {
									return " (Java class: " + object.getClass().getName() + ")";
								}
								var rv = " typeof=" + typeof(object);
								var props = [];
								for (var x in object) {
									props.push(x);
								}
								rv += " properties=" + props.join(",");
								return rv;
							})();
							throw new Error("Unimplemented java.adapt: " + type + object);
						}
					};
				}
			}
		})();

		var Buffer = function() {
			var peer = new Packages.inonit.script.runtime.io.Streams.Bytes.Buffer();

			this.close = function() {
				peer.getOutputStream().close();
			}

			//	TODO	could we name these better? in/out, read/write, ... ?

			this.writeBinary = function() {
				return OutputStream(peer.getOutputStream());
			}

			this.writeText = function() {
				return this.writeBinary().character();
			}

			this.readBinary = function() {
				return InputStream(peer.getInputStream());
			}

			this.readText = function() {
				return this.readBinary().character();
			}
		};

		//	TODO	this operation existed at one time and perhaps should be resurrected in some form, perhaps via a function
		//			that caches an InputStream: that is of type (input: InputStream) => () => InputStream
		//
		//			Could be implemented in terms of ArrayBuffer below
		//
		// <ul>
		// 	<li class="constructor">
		// 		<div class="name">Resource</div>
		// 		<span>Creates a resource that contains the contents of this stream.</span>
		// 		<div class="arguments">
		// 			<div class="label">Arguments</div>
		// 			<ol>
		// 				<li class="value">
		// 					<span class="type"><a href="local/doc/typedoc/interfaces/slime.mimetype.html">type</a></span>
		// 					<span>The MIME type of the data in this stream.</span>
		// 				</li>
		// 			</ol>
		// 		</div>
		// 		<div class="instances">
		// 			<div class="label">Instances</div>
		// 			<span class="type"><a href="#types.Resource">Resource</a></span>
		// 		</div>
		// 	</li>
		// </ul>

		/** @type { slime.jrunscript.runtime.io.Exports["wo"] } */
		var wo = {
			text: function(configuration) {
				return {
					/**
					 *
					 * @param { slime.jrunscript.runtime.io.InputStream } input
					 * @returns
					 */
					all: function(input) {
						return function(events) {
							var reader = Reader.stream({
								stream: input,
								configuration: configuration
							});
							var rv = reader.asString();
							events.fire("progress", rv);
							events.fire("done");

							//	TODO	switch to Java implementation to be consistent with lines?

							//	TODO	or use Packages.java.nio.charset.StandardCharsets.UTF_8?
							// var charset = String(Packages.java.nio.charset.Charset.defaultCharset().name());
							// var reader = input.character({ charset: charset });
							// $context._streams.readAll(
							// 	reader.java.adapt(),
							// 	new JavaAdapter(
							// 		Packages.inonit.script.runtime.io.Streams.ReadEvents,
							// 		{
							// 			progress: function(string) {
							// 				events.fire("progress", String(string));
							// 			},
							// 			error: function(e) {
							// 				//	TODO	improve
							// 				throw new Error();
							// 			},
							// 			done: function() {
							// 				events.fire("done");
							// 			}
							// 		}
							// 	)
							// );
						}
					},
					lines: function(input) {
						return function(events) {
							var reader = Reader.stream({ stream: input, configuration: configuration });
							$context._streams.readLines(
								reader.java.adapt(),
								configuration.newline,
								new JavaAdapter(
									Packages.inonit.script.runtime.io.Streams.ReadEvents,
									{
										progress: function(_string) {
											var string = String(_string);
											events.fire("progress", string);
											var terminated = string.substring(string.length - configuration.newline.length) == configuration.newline;
											events.fire("line", (terminated) ? string.substring(0, string.length - configuration.newline.length) : string);
										},
										error: function(e) {
											//	TODO	improve
											throw new Error();
										},
										done: function() {
											events.fire("done");
										}
									}
								)
							);
						}
					}
				}
			}
		};

		$export({
			ArrayBuffer: {
				read: function(stream) {
					return readToArrayBuffer(stream.java.adapt());
				}
			},
			InputStream: {
				java: InputStream,
				string: (
					function() {
						var javaDefault = Charset.java(Packages.java.nio.charset.Charset.defaultCharset());

						/** @type { slime.jrunscript.runtime.io.Exports["InputStream"]["string"]["encoding"] } */
						var encoding = function(p) {
							var buffer = new Buffer();
							var _writer = new Packages.java.io.OutputStreamWriter(buffer.writeBinary().java.adapt(), p.charset.java.adapt());
							_writer.write(p.string);
							_writer.close();
							return buffer.readBinary();
						};

						return {
							encoding: encoding,
							default: $api.fp.now(encoding, $api.fp.curry({ charset: javaDefault }), $api.fp.flatten("string"))
						}
					}
				)()
			},
			OutputStream: OutputStream,
			Reader: Reader,
			Writer: {
				old: OldWriter,
				java: function(p) {
					return Writer(p.java, p.newline);
				},
				stream: function(p) {
					var _writer = new Packages.java.io.OutputStreamWriter(p.stream.java.adapt(), p.charset.java.adapt());
					return Writer(_writer, p.newline);
				}
			},
			Charset: {
				standard: {
					utf8: Charset.java(Packages.java.nio.charset.StandardCharsets.UTF_8)
				},
				default: Charset.default
			},
			Streams: Streams,
			Buffer: Buffer,
			system: {
				delimiter: {
					line: inputs.line.separator()
				}
			},
			wo: {
				// process: function(processor) {
				// 	return $api.fp.world.Means.output(processor);
				// },
				text: function(configuration) {
					return wo.text(configuration);
				}
			}
		});
	}
//@ts-ignore
)($platform, Packages, JavaAdapter, (function() { return this.XMLList })(), $api, $context, $export);
