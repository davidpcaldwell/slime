//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/ip SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.tcp = new function() {
	this.getEphemeralPortNumber = function() {
		var _socket = new Packages.java.net.ServerSocket(0);
		var rv = _socket.getLocalPort();
		_socket.close();
		return rv;
	};
};

$exports.Host = function(o) {
	this.isReachable = function(p) {
		var ping = $context.api.shell.os.ping({
			host: o.name
		});
		return ping.status == 0;
	}
}

$exports.Port = function(o) {
	if (typeof(o) == "number") o = { number: o };
	var number = o.number;
	
	Object.defineProperty(this, "number", {
		enumerable: true,
		configurable: true,
		value: number,
		writable: false
	});
	
	this.__defineGetter__("number", function() {
		return number;
	});

	this.isOpen = $api.debug.disableBreakOnExceptionsFor(function() {
		var debug = function(message) {
			//Packages.java.lang.System.err.println(message);
		}
		debug.exception = function(e) {
			//e.rhinoException.printStackTrace();
		}

		var _server;
		var _client;
		try {
			_server = new Packages.java.net.ServerSocket(number);
			debug("Opened server socket for " + number);
			_server.close();
			_server = null;
			try {
				_client = new Packages.java.net.Socket("localhost",number);
				debug("Opened client socket for " + number);
				return false;
			} catch (e) {
				debug("Did not open client socket for " + number);
				debug.exception(e);
				return true;
			}
		} catch (e) {
			debug("Did not open server socket for " + number);
			debug.exception(e);
			return false;
		} finally {
			if (_server) _server.close();
			if (_client) _client.close();
		}
	});
};

$exports.getEphemeralPort = function() {
	return new $exports.Port($exports.tcp.getEphemeralPortNumber());
}