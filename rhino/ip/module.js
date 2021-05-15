//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.ip.Context } $context
	 * @param { slime.jrunscript.ip.Exports } $exports
	 */
	function(Packages,$api,$context,$exports) {
		$exports.tcp = {
			getEphemeralPortNumber: function() {
				var _socket = new Packages.java.net.ServerSocket(0);
				var rv = _socket.getLocalPort();
				_socket.close();
				return rv;
			}
		};

		var assert = function(test,failure) {
			return $api.Function.conditional(
				test,
				function(o) { return o; },
				failure
			);
		};

		var equals = function(value) {
			return function(v) {
				return v == value;
			}
		};

		var mustBeType = function(type) {
			return assert(
				$api.Function.pipe(
					$api.Function.type,
					equals(type)
				),
				function(v) {
					throw new TypeError("Argument must be " + type + ", not " + $api.Function.type(v));
				}
			);
		}

		$exports.Host = $api.Function.pipe(
			mustBeType("object"),
			assert(
				$api.Function.pipe(
					$api.Function.property("name"),
					$api.Function.type,
					equals("string")
				),
				function(v) {
					throw new TypeError("name property must be string, not " + $api.Function.type(v.name));
				}
			),
			function(o) {
				return {
					isReachable: function(p) {
						var ping = $context.api.shell.os.ping({
							host: o.name,
							timeout: (p && p.timeout) ? p.timeout : void(0)
						});
						return ping.status == 0;
					}
				}
			}
		);

		$exports.Port = function(o) {
			if (typeof(o) == "number") o = { number: o };
			var number = o.number;

			var rv = {
				number: void(0),
				isOpen: $api.debug.disableBreakOnExceptionsFor(function() {
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
				})
			};

			Object.defineProperty(rv, "number", {
				enumerable: true,
				value: number
			});

			return rv;
		};

		$exports.getEphemeralPort = function() {
			return $exports.Port({ number: $exports.tcp.getEphemeralPortNumber() });
		}
	}
//@ts-ignore
)(Packages,$api,$context,$exports);
