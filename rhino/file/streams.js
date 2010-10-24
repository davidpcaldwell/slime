//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
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

	this.close = function() {
		peer.close();
	}

	this.asProperties = function() {
		var properties = new Packages.java.util.Properties();
		properties.load( this.$getInputStream() );
		//	TODO	Do we need to close the stream?  Or does Java do this for us?
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
	$context.deprecate(this, "characters");
}
var OutputStream = function(peer) {
	this.$getOutputStream = function() {
		return peer;
	}

	this.close = function() {
		peer.close();
	}
}
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
			mode.onEnd.apply(this, []);
		} else {
			mode.onEnd.apply(this, [ result ]);
		}
		return result;
	}

	this.readLines.UNIX = "\n";
	this.readLines.DOS = "\r\n";
	$context.deprecate(this.readLines, "UNIX");
	$context.deprecate(this.readLines, "DOS");

	this.asString = function() {
		var buffer = new Packages.java.io.StringWriter();
		$context.$java.copy(
			this.$getReader(),
			buffer
		);
		return String( buffer.toString() );
	}

	this.asXml = function() {
		//	TODO	Figure out how to get rid of prologue, etc.?
		return XMLList( this.asString() );
	}

	this.close = function() {
		peer.close();
	}
}
var Writer = function(peer,filesystem) {
	this.$getWriter = function() {
		return peer;
	}

	this.close = function() {
		peer.close();
	}

	this.write = function(string) {
		if (typeof(string) == "xml") {
			peer.write( string.toXMLString() );
		} else {
			peer.write( string );
		}
	}
}
var Streams = new function() {
	this.binary = new function() {
		this.copy = function(from,to) {
			var $r = (function() {
				if ($context.isJavaType(Packages.java.io.InputStream)(from)) return from;
				if (from.$getInputStream) return from.$getInputStream();
			})();
			var $w = (function() {
				if ($context.isJavaType(Packages.java.io.OutputStream)(to)) return to;
				if (to.$getOutputStream) return to.$getOutputStream();
			})();
			$context.$java.copy($r,$w)
		}

		this.Buffer = function() {
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

			this.readBinary = function() {
				return new InputStream(peer.getInputStream());
			}

			this.readText = function() {
				return new Reader( new Packages.java.io.InputStreamReader(peer.getInputStream()) );
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
$exports.Reader = Reader;
$exports.Writer = Writer;
$exports.InputStream = InputStream;
$exports.OutputStream = OutputStream;
