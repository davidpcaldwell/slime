//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { any } $platform
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } XMLList
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.runtime.io.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.runtime.io.Exports> } $export
	 */
	function($platform,Packages,XMLList,$api,$context,$export) {
		var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

		var _java = $context._streams;

		function InputStream(peer) {
			/**
			 *
			 * @param { slime.jrunscript.runtime.io.input.ReaderConfiguration } [mode]
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
				return Reader(new Packages.java.io.InputStreamReader(peer,mode.charset), {LINE_SEPARATOR: separator});
			};

			//	TODO	this operation existed at one time and perhaps should be resurrected in some form, perhaps via a function
			//			that caches an InputStream: that is of type (input: InputStream) => () => InputStream
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

			return {
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
				},
				characters: $api.deprecate(character)
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
					return Writer(new Packages.java.io.OutputStreamWriter(peer));
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
		 * @param { Parameters<slime.jrunscript.runtime.io.Exports["Reader"]>[0] } peer
		 * @param { Parameters<slime.jrunscript.runtime.io.Exports["Reader"]>[1] } properties
		 */
		var Reader = function(peer,properties) {
			var readLines = Object.assign(
				/**
				 * @type { slime.jrunscript.runtime.io.Reader["readLines"] }
				 */
				function(callback,mode) {
					if (!mode) mode = {};
					//	TODO	should we retrieve properties from the jrunscript/host module, or is this sufficient?
					if (!mode.ending && properties && properties.LINE_SEPARATOR) mode.ending = properties.LINE_SEPARATOR;
					if (!mode.ending) mode.ending = LINE_SEPARATOR;
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
		};

		/** @type { slime.jrunscript.runtime.io.Exports["Writer"] } */
		var Writer = function(peer) {
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
		};

		/**
		 *
		 * @param { slime.jrunscript.native.java.nio.charset.Charset } _peer
		 * @return { slime.jrunscript.runtime.io.Charset }
		 */
		function Charset(_peer) {
			return {
				read: function(input) {
					return Reader(new Packages.java.io.InputStreamReader(input.java.adapt(), _peer));
				},
				write: function(output) {
					return Writer(new Packages.java.io.OutputStreamWriter(output.java.adapt(), _peer));
				}
			}
		}

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
							return Reader(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaWriter(object)) {
							return Writer(object);
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

		$export({
			InputStream: {
				from: {
					java: InputStream,
					string: function(p) {
						var buffer = new Buffer();
						var writer = p.charset.write(buffer.writeBinary());
						writer.write(p.string);
						writer.close();
						return buffer.readBinary();
					}
				}
			},
			OutputStream: OutputStream,
			Reader: Reader,
			Writer: Writer,
			Charset: {
				standard: {
					utf8: Charset(Packages.java.nio.charset.StandardCharsets.UTF_8)
				}
			},
			Streams: Streams,
			Buffer: Buffer,
			system: {
				delimiter: {
					line: LINE_SEPARATOR
				}
			}
		});
	}
//@ts-ignore
)($platform, Packages, (function() { return this.XMLList })(), $api, $context, $export);
