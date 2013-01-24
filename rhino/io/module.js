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

var $java = ($context.$java) ? $context.$java : new Packages.inonit.script.runtime.io.Streams();

var InputStream = function(peer) {
	this.$getInputStream = $api.deprecate(function() {
		return peer;
	});

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

	this.cache = function() {
		var $bytes = $java.readBytes(peer);
		return new Resource(new function() {
			this.read = new function() {
				this.binary = function() {
					return new InputStream(Packages.java.io.ByteArrayInputStream($bytes));
				}
			}
		});
	}
	
	this.java = new function() {
		this.adapt = function() {
			return peer;
		}

		this.array = function() {
			return $java.readBytes(peer);
		}
	};
};

var OutputStream = function(peer) {
	this.$getOutputStream = $api.deprecate(function() {
		return peer;
	});

	this.close = function() {
		peer.close();
	}

	this.character = function() {
		return new Writer(new Packages.java.io.OutputStreamWriter(peer));
	}

	this.split = function(other) {
		var otherPeer = other.java.adapt();

		//	Handle Buffer special case
		if (!otherPeer && other.$getOutputStream) {
			otherPeer = other.$getOutputStream();
		}

		return new OutputStream($java.split(peer,otherPeer))
	}

	this.java = new function() {
		this.adapt = function() {
			return peer;
		}
	}
};

var Reader = function(peer) {
	this.$getReader = $api.deprecate(function() {
		return peer;
	});
	
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
		while( (line = $java.readLine(peer,mode.ending)) != null ) {
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
		$java.copy(
			this.$getReader(),
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
	this.$getWriter = $api.deprecate(function() {
		return peer;
	});

	this.close = function() {
		peer.close();
	}

	this.write = function(string) {
		if (typeof(string) == "xml") {
			peer.write( string.toXMLString() );
			peer.flush();
		} else if (typeof(string) == "string") {
			peer.write( string );
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

	this.$getOutputStream = function() {
		return peer.getOutputStream();
	}

	this.$getInputStream = function() {
		return peer.getInputStream();
	}

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
			var $r = (function() {
				if ($context.api.java.isJavaType(Packages.java.io.InputStream)(from)) return from;
				if (from.java && from.java.adapt) return from.java.adapt();
				if (from.$getInputStream) return from.$getInputStream();
			})();
			var $w = (function() {
				if ($context.api.java.isJavaType(Packages.java.io.OutputStream)(to)) return to;
				if (to.java && to.java.adapt) return to.java.adapt();
				if (to.$getOutputStream) return to.$getOutputStream();
			})();
			if (mode) {
				$java.copy($r,$w,false);
				if (mode.onFinish) {
					mode.onFinish($r,$w);
				}
			} else {
				$java.copy($r,$w);
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
			$java.copy(
				from.$getReader(),
				to.$getWriter()
			);
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
	}
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

	this.read = function(mode) {
		if (binary) {
			if (mode == Streams.binary) return binary();
		}
		if (text) {
			if (mode == Streams.text) return text();
			if (mode == XML) return text().asXml();
			if (mode == String) return text().asString();
		}
		throw new TypeError("No compatible read() mode specified: argument was " + mode);
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
			} else if (typeof(dataOrType) == "string" && writeText) {
				var writer = writeText(mode);
				writer.write(dataOrType);
				writer.close();
			} else if (typeof(dataOrType) == "xml" && writeText) {
				var writer = writeText(mode);
				writer.write(dataOrType.toXMLString());
				writer.close();
			} else {
				throw new Error("No compatible write mode, trying to write: " + dataOrType);
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

$exports.Loader = function(p) {
	if (p.resources) {
		//	TODO	could try to push parts of this dependency on Java classes back into rhino loader, without pushing a dependency
		//			on this package into it
		var _resources = new JavaAdapter(
			Packages.inonit.script.rhino.Code.Source.Resources,
			new function() {
				this.toString = function() {
					return p.resources.toString();
				}

				this.getResourceAsStream = function(path) {
					var stream = p.resources.getResourceAsStream(String(path));
					if (stream) return stream.java.adapt();
					return null;
				}
			}
		);
		var rv = new $context.$rhino.Loader({ _source: Packages.inonit.script.rhino.Code.Source.create(_resources) });
		arguments.callee.decorate(rv);
		return rv;
	} else {
		var rv = new $context.$rhino.Loader(p);
		arguments.callee.decorate(rv);
		return rv;
	}
};
$exports.Loader.decorate = function(rv) {
	rv.resource = (function(target) {
		return function(path) {
			var _in = target._resource(path);
			if (!_in) return null;
			_in.close();
			return new $exports.Resource({
				read: {
					binary: function() {
						return new InputStream(target._resource(path));
					}
				}
			})
		}
	})(rv);
	return rv;
}