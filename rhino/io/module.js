//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/io SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var InputStream = function(peer) {
	this.$getInputStream = function() {
		return peer;
	}
	$api.deprecate(this,"$getInputStream");

	this.java = new function() {
		this.adapt = function() {
			return peer;
		}
	};

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
		//	TODO	is this $context.$java?
		var $streams = new Packages.inonit.script.runtime.io.Streams();
		var $bytes = $streams.readBytes(peer);
		return new Resource(new function() {
			this.read = new function() {
				this.binary = function() {
					return new InputStream(Packages.java.io.ByteArrayInputStream($bytes));
				}
			}
		});
	}
};

var OutputStream = function(peer) {
	this.$getOutputStream = function() {
		return peer;
	}
	$api.deprecate(this,"$getOutputStream");
	
	this.java = new function() {
		this.adapt = function() {
			return peer;
		}
	}

	this.close = function() {
		peer.close();
	}
	
	this.character = function() {
		return new Writer(new Packages.java.io.OutputStreamWriter(peer));
	}
};

var Reader = function(peer) {
	this.$getReader = function() {
		return peer;
	}

	this.readLines = function(callback,mode) {

		if (!mode) mode = {};
		//	TODO	Does equivalent of "default" filesystem still exist?
		//	if (!filesystem) filesystem = $script.filesystem;
//		if (!mode.ending) mode.ending = filesystem.LINE_SEPARATOR;
		if (!mode.ending) throw "Required: mode with 'ending' property";
		if (!mode.onEnd) mode.onEnd = function() { peer.close(); }
		var line;
		var result;
		while( (line = $context.$java.readLine(peer,mode.ending)) != null ) {
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
		$context.$java.copy(
			this.$getReader(),
			buffer
		);
		return String( buffer.toString() );
	}

	//	TODO	Figure out how to get rid of prologue, etc.?
	this.asXml = function() {
		//	First, read the string into a variable so that we still have it in case of error (stream may not be re-readable).
		var string = this.asString();
		return XMLList( string );
	}

	this.close = function() {
		peer.close();
	}
}
var Writer = function(peer) {
	this.$getWriter = function() {
		return peer;
	}

	this.close = function() {
		peer.close();
	}

	this.write = function(string) {
		if (typeof(string) == "xml") {
			peer.write( string.toXMLString() );
			peer.flush();
		} else {
			peer.write( string );
			peer.flush();
		}
	}
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
		this.copy = function(from,to) {
			var $r = (function() {
				if ($context.api.java.isJavaType(Packages.java.io.InputStream)(from)) return from;
				if (from.$getInputStream) return from.$getInputStream();
			})();
			var $w = (function() {
				if ($context.api.java.isJavaType(Packages.java.io.OutputStream)(to)) return to;
				if (to.$getOutputStream) return to.$getOutputStream();
			})();
			$context.$java.copy($r,$w)
		}

		this.Buffer = function() {
			if (this.constructor == arguments.callee) {
				//	deprecated
				debugger;
				return new Buffer();
			} else {
				throw "Unimplemented: Buffer called as function.";
			}
		}
	}

	this.text = new function() {
		this.copy = function(from,to) {
			$context.$java.copy(
				from.$getReader(),
				to.$getWriter()
			);
		}
	}

	this.stderr = new function() {
		this.$getOutputStream = function() {
			return $context.stdio.$err;
		}

		this.$getWriter = function() {
			return new Packages.java.io.OutputStreamWriter($context.stdio.$err);
		}

		this.close = function() {}
	}

	this.stdout = new function() {
		this.$getOutputStream = function() {
			return $context.stdio.$out;
		}

		this.$getWriter = function() {
			return new Packages.java.io.OutputStreamWriter($context.stdio.$out);
		}

		this.close = function() {}
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
	var binary = function() {
		if (p.read && p.read.binary) {
			return p.read.binary();
		}		
	}
	
	var text = function() {
		if (p.read && p.read.text) {
			return p.read.text();
		}
		if (p.read && p.read.binary) {
			return p.read.binary().character();
		}
	}

	this.read = function(mode) {
		if (p.read && p.read.binary) {
			if (mode == Streams.binary) return binary();
			if (mode == Streams.text) return text();
			if (mode == XML) return text().asXml();
			if (mode == String) return text().asString();
			throw "No read() mode specified: argument was " + mode;
		}
	}

	this.read.lines = function() {
		var text = text();
		return text.readLines.apply(text,arguments);
	}
	
	if (p.write) {
		var writeText = function(mode) {
			if (p.write.text) {
				return p.write.text(mode);
			} else if (p.write.binary) {
				return p.write.binary(mode).character();
			}
		}
		
		this.write = function(dataOrType,mode) {
			if (!mode) mode = {};
			if (dataOrType == Streams.binary) {
				return p.write.binary(mode);
			} else if (dataOrType == Streams.text) {
				return writeText(mode);
			} else if (typeof(dataOrType) == "string") {
				var writer = writeText(mode);
				writer.write(dataOrType);
				writer.close();
			} else if (typeof(dataOrType) == "xml") {
				var writer = writeText(mode);
				writer.write(dataOrType.toXMLString());
				writer.close();
			} else {
				fail("Unimplemented: write " + dataOrType);
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

