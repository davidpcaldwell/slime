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

var _java = $context._streams;

var OutputStream = function OutputStream(peer) {
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

var InputStream = function(peer) {
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

$exports.OutputStream = OutputStream;
$exports.Writer = Writer;
$exports.InputStream = InputStream;
$exports.Reader = Reader;