//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	rename this
var _java = ($context.$java) ? $context.$java : new Packages.inonit.script.runtime.io.Streams();

var InputStream = function(peer) {
	this.close = function() {
		peer.close();
	}

	this.asProperties = function() {
		var properties = new Packages.java.util.Properties();
		properties.load( peer );
		peer.close();
		return $context.api.java.Properties.adapt(properties);
	}

	this.character = function(mode) {
		if (!mode) mode = {};
		if (!mode.charset) mode.charset = Packages.java.nio.charset.Charset.defaultCharset().name();
		var separator = mode.LINE_SEPARATOR;
		//	TODO	No unit test for this method currently; does it work?
		return new Reader(new Packages.java.io.InputStreamReader(peer,mode.charset), {LINE_SEPARATOR: separator});
	}

	this.characters = this.character;
	$api.deprecate(this, "characters");

	this.cache = $api.deprecate(function() {
		var $bytes = _java.readBytes(peer);
		return new Resource(new function() {
			this.read = new function() {
				this.binary = function() {
					return new InputStream(new Packages.java.io.ByteArrayInputStream($bytes));
				}
			}
		});
	});

	this.Resource = function(type) {
		var _bytes = _java.readBytes(peer);
		return new Resource(new function() {
			this.type = type;

			this.read = new function() {
				this.binary = function() {
					return new InputStream(new Packages.java.io.ByteArrayInputStream(_bytes));
				}
			}
		});
	}

	this.java = new function() {
		this.adapt = function() {
			return peer;
		}

		this.array = function() {
			return _java.readBytes(peer);
		}
	};
};

var OutputStream = function(peer) {
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
};

var Reader = function(peer) {
	this.close = function() {
		peer.close();
	}

	this.readLines = function(callback,mode) {
		if (!mode) mode = {};
		//	TODO	should we retrieve properties from the rhino/host module, or is this sufficient?
		if (!mode.ending) mode.ending = String(Packages.java.lang.System.getProperty("line.separator"));
		if (!mode.onEnd) mode.onEnd = function() { peer.close(); }
		var line;
		var result;
		while( (line = _java.readLine(peer,mode.ending)) != null ) {
			result = callback( String( line ) );
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
	}

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

	this.asXml = function() {
		//	First, read the string into a variable so that we still have it in case of error (stream may not be re-readable).
		var string = this.asString();
		string = string.replace(/\<\?xml.*\?\>/, "");
		string = string.replace(/\<\!DOCTYPE.*?\>/, "");
		return XMLList( string );
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

	this.write = function(string) {
		if (typeof(string) == "xml") {
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
$exports.Buffer = Buffer;

var Streams = new function() {
	this.binary = new function() {
		this.copy = function(from,to,mode) {
			var isJavaType = $context.api.java.isJavaType;
			var _r = (function() {
				if (isJavaType(Packages.java.io.InputStream)(from)) return from;
				if (from.java && from.java.adapt && isJavaType(Packages.java.io.InputStream)(from.java.adapt())) return from.java.adapt();
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

		this.Buffer = function() {
			if (this.constructor == arguments.callee) {
				//	deprecated
				debugger;
				return new Buffer();
			} else {
				throw new Error("Unimplemented: Buffer called as function.");
			}
		}
	}

	this.text = new function() {
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
	}

	if ($context.stdio) {
		var StandardOutputStream = function(_peer) {
			var rv = new OutputStream(_peer);
			rv.write = function(message) {
				var _writer = new Packages.java.io.OutputStreamWriter(_peer);
				_writer.write(message);
				_writer.flush();
			};
			delete rv.close;
			return rv;
		}

		this.stderr = StandardOutputStream($context.stdio.$err);
		this.stdout = StandardOutputStream($context.stdio.$out);
	}
}
$exports.Streams = Streams;

$exports.java = new function() {
	this.adapt = function(object) {
		if (false) {
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.InputStream)(object)) {
			return new InputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(object)) {
			return new OutputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Reader)(object)) {
			return new Reader(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Writer)(object)) {
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
			throw "Unimplemented java.adapt: " + type + object;
		}
	};
}

var Resource = function(p) {
	var binary = (function() {
		if (p.read && p.read.binary) {
			return function() {
				return p.read.binary();
			}
		}
	})();

	var text = (function() {
		if (p.read && p.read.text) {
			return function() {
				return p.read.text();
			}
		}
		if (p.read && p.read.binary) {
			return function() {
				return p.read.binary().character();
			}
		}
	})();

	if (p.type) {
		//	TODO	may want to do some sort of "cast" here
		this.type = p.type;
	}

	var global = (function() { return this; })();

	this.read = function(mode) {
		var _properties = function(peer) {
			//	peer can be Packages.java.io.InputStream or Packages.java.io.Reader
			var properties = new Packages.java.util.Properties();
			properties.load( peer );
			peer.close();
			return properties;
		}

		if (binary) {
			if (mode == Streams.binary) return binary();
			if (mode == Packages.java.util.Properties) return _properties(binary().java.adapt());
		}
		if (text) {
			if (mode == Streams.text) return text();
			if (mode == String) return text().asString();
			if (mode == Packages.java.util.Properties) return _properties(text().java.adapt());
			if (typeof(global.XML) != "undefined") {
				if (mode == XML) return text().asXml();
				if (/^function XML\(\)/.test(String(mode))) return text().asXml();
			}
		}
		var parameters = (function() {
			if (!p) return String(p);
			if (typeof(p) == "object") return String(p) + " with keys: " + Object.keys(p);
			return String(p);
		})();
		throw new TypeError("No compatible read() mode specified: parameters = " + parameters + " binary=" + binary + " text=" + text + " argument was " + mode
			+ " Streams.binary " + (mode == Streams.binary)
			+ " Streams.text " + (mode == Streams.text)
			+ " XML " + (mode == global.XML)
			+ " String " + (mode == String)
		);
	}

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

	if (typeof(p.length) == "number") {
		this.length = p.length;
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
			if (dataOrType == Streams.binary && writeBinary) {
				return writeBinary(mode);
			} else if (dataOrType == Streams.text && writeText) {
				return writeText(mode);
			} else if (dataOrType.java && dataOrType.java.adapt && $context.api.java.isJavaType(Packages.java.io.InputStream)(dataOrType.java.adapt())) {
				var stream = writeBinary(mode);
				Streams.binary.copy(dataOrType,stream);
				stream.close();
			} else if (dataOrType.java && dataOrType.java.adapt && $context.api.java.isJavaType(Packages.java.io.Reader)(dataOrType.java.adapt())) {
				stream = writeText(mode);
				Streams.text.copy(dataOrType,stream);
				stream.close();
			} else if (typeof(dataOrType) == "string" && writeText) {
				var writer = writeText(mode);
				writer.write(dataOrType);
				writer.close();
			} else if (typeof(dataOrType) == "object" && $context.api.java.isJavaType(Packages.java.util.Properties)(dataOrType)) {
				var writer = writeText(mode);
				dataOrType.store(writer.java.adapt(), null);
				writer.close();
			} else if (typeof(dataOrType) == "xml" && writeText) {
				var writer = writeText(mode);
				writer.write(dataOrType.toXMLString());
				writer.close();
			} else {
				throw new TypeError("No compatible write mode, trying to write: " + dataOrType);
			}
		}
	}
}
$exports.Resource = Resource;

//	TODO	It may be that the following exports are not necessary and can actually all be accessed through java.adapt
$exports.Reader = Reader;
$exports.Writer = Writer;
$exports.InputStream = InputStream;
$exports.OutputStream = OutputStream;

var Loader = function(underlying) {
	return function(p) {
		if (p.resources) {
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
						rv.type = $context.$rhino.Loader.getTypeFromPath(path);
					}
					Object.defineProperty(rv, "_stream", {
						get: function() {
							return resource.read.binary().java.adapt();
						}
					});
					$context.$rhino.Loader.addStringProperty(rv);
					return rv;
				} else {
					return null;
				}
			};
		}
		underlying.apply(this,arguments);
		//	TODO	NASHORN	decorate.call(this,p) did not work as p was somehow null
		this.resource = function(path) {
			var gotten = p.get(path);
			if (!gotten) return null;
			return new $exports.Resource({
				type: gotten.type,
				length: gotten.length,
				read: {
					binary: function() {
						return new InputStream(gotten._stream);
					}
				}
			});
		};
	};
};

$exports.Loader = Loader($context.$rhino.Loader);

$exports.mime = $loader.file("mime.js", {
	_streams: _java,
	nojavamail: $context.nojavamail,
	api: {
		java: $context.api.java,
		mime: $context.api.mime,
		io: $exports
	}
});