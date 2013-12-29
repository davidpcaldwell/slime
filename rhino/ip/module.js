$exports.tcp = new function() {
	this.getEphemeralPortNumber = function() {
		var _socket = new Packages.java.net.ServerSocket(0);
		var rv = _socket.getLocalPort();
		_socket.close();
		return rv;
	};
};

$exports.Port = function(number) {
	this.__defineGetter__("number", function() {
		return number;
	});

	this.isOpen = function() {
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
	}
};

$exports.getEphemeralPort = function() {
	return new $exports.Port($exports.tcp.getEphemeralPortNumber());
}