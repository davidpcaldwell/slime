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
	 * @param { slime.loader.Export<slime.jrunscript.ip.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		var tcp = {
			getEphemeralPortNumber: function() {
				var _socket = new Packages.java.net.ServerSocket(0);
				var rv = _socket.getLocalPort();
				_socket.close();
				return rv;
			}
		};

		/**
		 * @template { any } T
		 * @param { (t: T) => boolean } test
		 * @param { (t: T) => Error } failure
		 */
		var assert = function(test,failure) {
			return $api.Function.conditional({
				condition: test,
				true: function(o) {
					return o;
				},
				false: function(o) {
					throw failure(o);
				}
			});
		};

		/**
		 * @template { any } T
		 * @param { string } type
		 * @returns { (t: T) => T }
		 */
		var mustBeType = function(type) {
			return assert(
				$api.Function.pipe(
					$api.Function.type,
					$api.Function.Predicate.equals(type)
				),
				function(v) {
					throw new TypeError("Argument must be " + type + ", not " + $api.Function.type(v));
				}
			);
		};

		/** @type { (v: any) => slime.jrunscript.ip.Host } */
		var castToHost = $api.Function.identity;

		var Host = $api.Function.pipe(
			castToHost,
			mustBeType("object"),
			assert(
				$api.Function.pipe(
					$api.Function.property("name"),
					$api.Function.type,
					$api.Function.Predicate.equals("string")
				),
				function(v) {
					return new TypeError("name property must be string, not " + $api.Function.type(v.name));
				}
			),
			function(o) {
				return {
					toString: function() {
						return "[Host: " + o.name + "]";
					},
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

		var Port = function(o) {
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

		var getEphemeralPort = function() {
			return Port({ number: tcp.getEphemeralPortNumber() });
		};

		var world = {
			/** @type { slime.jrunscript.ip.World["isReachable"] } */
			isReachable: function(p) {
				return $api.Function.world.old.ask(function(events) {
					try {
						if (p.port) {
							var _socket = new Packages.java.net.Socket();
							_socket.connect(
								new Packages.java.net.InetSocketAddress(p.host.name, (p.port) ? p.port.number : 7),
								p.timeout.milliseconds
							);
						} else {
							return Packages.java.net.InetAddress.getByName(p.host.name).isReachable(p.timeout.milliseconds);
						}
						return true;
					} catch (e) {
						events.fire("error", e);
						return false;
					}
				})
			},
			/** @type { slime.jrunscript.ip.World["tcp"] } */
			tcp: {
				isAvailable: function(p) {
					return $api.Function.world.old.ask(function(events) {
						var number = p.port.number;

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
								events.fire("exception", e);
								return true;
							}
						} catch (e) {
							debug("Did not open server socket for " + number);
							debug.exception(e);
							events.fire("exception", e);
							return false;
						} finally {
							if (_server) _server.close();
							if (_client) _client.close();
						}
					});
				}
			}
		}

		$export({
			tcp: {
				getEphemeralPortNumber: tcp.getEphemeralPortNumber,
				Port: {
					isAvailable: function(q) {
						return {
							run: function(p) {
								var ask = ( (p && p.world) ? p.world : world ).tcp.isAvailable({ port: q.port });
								return ask();
							}
						}
					}
				}
			},
			Host: Host,
			Port: Port,
			getEphemeralPort: getEphemeralPort,
			world: world,
			reachable: {
				configuration: function(configuration) {
					return {
						endpoint: function(endpoint) {
							return {
								run: function(p) {
									var ask = ( (p && p.world) ? p.world : world ).isReachable({
										timeout: configuration.timeout,
										host: endpoint.host,
										port: endpoint.port
									});
									return ask({
										error: function(e) {
											if (p && p.error) p.error(e.detail);
											throw e.detail;
										}
									});
								}
							}
						}
					}
				}
			}
		})
	}
//@ts-ignore
)(Packages,$api,$context,$export);
