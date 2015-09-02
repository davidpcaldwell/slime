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

(function() {
	//	TODO	NASHORN	naming this to OutputStream causes an error in Nashorn
	var xOutputStream = function OutputStream(peer) {
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

	return {
		OutputStream: xOutputStream,
		Writer: Writer
	};
})()