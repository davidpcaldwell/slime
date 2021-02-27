//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { any } $platform
	 * @param { any } Packages
	 * @param { any } XMLList
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.runtime.io.Context } $context
	 * @param { slime.jrunscript.runtime.io.Exports } $exports
	 */
	function($platform,Packages,XMLList,$api,$context,$exports) {
		var _java = $context._streams;

		/**
		 *
		 * @param { slime.jrunscript.native.java.io.OutputStream } peer
		 */
		function OutputStream(peer) {
			this.close = function() {
				peer.close();
			}

			this.character = function() {
				return new Writer(new Packages.java.io.OutputStreamWriter(peer));
			}

			this.split = function(other) {
				var otherPeer = other.java.adapt();

				//	Handle Buffer special case, very dubious
				if (!otherPeer && other.writeBinary) {
					otherPeer = other.writeBinary.java.adapt();
				}

				return new OutputStream(_java.split(peer,otherPeer))
			}

			this.java = new function() {
				this.adapt = function() {
					return peer;
				}
			}
		}

		var Writer = function(peer) {
			this.close = function() {
				peer.close();
			}

			/** @returns { string } */
			var getTypeof = function(value) {
				return typeof(value);
			}

			this.write = function(string) {
				if (getTypeof(string) == "xml") {
					peer.write( string.toXMLString() );
					peer.flush();
				} else if (typeof(string) == "string") {
					peer.write( String(string) );
					peer.flush();
				} else {
					throw new TypeError("Attempt to write non-string, non-XML to writer: " + string);
				}
			};

			this.java = new function() {
				this.adapt = function() {
					return peer;
				}
			};
		};

		function InputStream(peer) {
			this.close = function() {
				peer.close();
			}

			this.character = function(mode) {
				if (!mode) mode = {};
				if (!mode.charset) mode.charset = Packages.java.nio.charset.Charset.defaultCharset().name();
				var separator = mode.LINE_SEPARATOR;
				//	TODO	No unit test for this method currently; does it work?
				return new Reader(new Packages.java.io.InputStreamReader(peer,mode.charset), {LINE_SEPARATOR: separator});
			}

			this.java = new function() {
				this.adapt = function() {
					return peer;
				}

				this.array = function() {
					return _java.readBytes(peer);
				}
			};

			this.characters = this.character;
			$api.deprecate(this, "characters");
		}

		/**
		 *
		 * @param {*} peer
		 * @param { { LINE_SEPARATOR?: string }} [properties]
		 */
		var Reader = function(peer,properties) {
			this.close = function() {
				peer.close();
			}

			this.readLines = Object.assign(function(callback,mode) {
				if (!mode) mode = {};
				//	TODO	should we retrieve properties from the jrunscript/host module, or is this sufficient?
				if (!mode.ending && properties && properties.LINE_SEPARATOR) mode.ending = properties.LINE_SEPARATOR;
				if (!mode.ending) mode.ending = String(Packages.java.lang.System.getProperty("line.separator"));
				if (!mode.onEnd) mode.onEnd = function() { peer.close(); }
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
				return result;
			}, {
				UNIX: void(0),
				DOS: void(0)
			});

			// this.read = function(callback,mode) {
			// 	if (!mode) mode = {};
			// 	if (!mode.onEnd) mode.onEnd = function() { peer.close(); };
			// 	var more = true;
			// 	var result;
			// 	while(more) {
			// 		var c = peer.read();
			// 		var result = callback( String(c) );
			// 		if (typeof(result) != "undefined") {
			// 			break;
			// 		}
			// 	}
			// 	if (typeof(result) == "undefined") {
			// 		mode.onEnd.call(this);
			// 	} else {
			// 		mode.onEnd.call(this,result);
			// 	}
			// 	return result;
			// }

			this.readLines.UNIX = "\n";
			this.readLines.DOS = "\r\n";
			$api.deprecate(this.readLines, "UNIX");
			$api.deprecate(this.readLines, "DOS");

			this.asString = function() {
				var buffer = new Packages.java.io.StringWriter();
				_java.copy(
					peer,
					buffer
				);
				return String( buffer.toString() );
			}

			if ($platform.e4x) {
				this.asXml = function() {
					var resource = new $context.api.Resource({
						string: this.asString()
					});
					return resource.read(XMLList);
				}
			}

			this.java = new function() {
				this.adapt = function() {
					return peer;
				}
			}
		};

		var Streams = (function() {
			return {
				binary: new function() {
					this.copy = function(from,to,mode) {
						var isJavaType = $context.api.java.isJavaType;
						var _r = (function() {
							if (isJavaType(Packages.java.io.InputStream)(from)) return from;
							var adapt = (from.java && from.java.adapt) ? from.java.adapt() : null;
							if (adapt && isJavaType(Packages.java.io.InputStream)(adapt)) return adapt;
						})();
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
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.InputStream } */
					var isJavaInputStream = $context.api.java.isJavaType(Packages.java.io.InputStream);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.OutputStream } */
					var isJavaOutputStream = $context.api.java.isJavaType(Packages.java.io.OutputStream);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.Reader } */
					var isJavaReader = $context.api.java.isJavaType(Packages.java.io.Reader);
					/** @type { (object: any) => object is slime.jrunscript.native.java.io.Writer } */
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
							return new InputStream(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaOutputStream(object)) {
							return new OutputStream(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaReader(object)) {
							return new Reader(object);
						} else if ($context.api.java.isJavaObject(object) && isJavaWriter(object)) {
							return new Writer(object);
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
				return new OutputStream(peer.getOutputStream());
			}

			this.writeText = function() {
				return this.writeBinary().character();
			}

			this.readBinary = function() {
				return new InputStream(peer.getInputStream());
			}

			this.readText = function() {
				return this.readBinary().character();
			}
		};

		$exports.OutputStream = OutputStream;
		$exports.Writer = Writer;
		$exports.InputStream = InputStream;
		$exports.Reader = Reader;

		$exports.Streams = Streams;
		$exports.Buffer = Buffer;
	}
//@ts-ignore
)($platform, Packages, (function() { return this.XMLList })(), $api, $context, $exports);
