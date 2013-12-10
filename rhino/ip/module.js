$exports.tcp = new function() {
	this.getEphemeralPortNumber = function() {
		var _socket = new Packages.java.net.ServerSocket(0);
		var rv = _socket.getLocalPort();
		_socket.close();
		return rv;
	};
}