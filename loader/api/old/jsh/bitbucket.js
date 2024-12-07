//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.unit.bitbucket.Context } $context
	 * @param { slime.loader.Export<slime.jsh.unit.bitbucket.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		var jsh = {
			file: $context.library.file
		};

		/** @type { slime.jsh.unit.bitbucket.Exports } */
		var MockBitbucketApi = function(o) {
			var hgserve;

			var startHgServer = function() {
				if (!hgserve) {
					// Packages.java.lang.System.err.println("Starting mock hg server ...");
					hgserve = new jsh.unit.mock.Hg.host(o);
					// Packages.java.lang.System.err.println("Created mock hg server.");
					hgserve.start();
					// Packages.java.lang.System.err.println("Started mock hg server.");
				}
				return hgserve;
			};

			var httpd = (function() {
				if (jsh.shell.jsh.src) return jsh.loader.file(jsh.shell.jsh.src.getRelativePath("rhino/http/servlet/server/loader.js"));
			})();

			var getHgServerProxy = (httpd)
				? $api.fp.impure.Input.memoized(function() {
					// Packages.java.lang.System.err.println("Invoke startHgServer");
					var server = startHgServer();
					// Packages.java.lang.System.err.println("Return httpd.Handler.Proxy");
					return new httpd.Handler.Proxy({
						client: new jsh.http.Client(),
						target: {
							host: "127.0.0.1",
							port: server.port
						}
					});
				})
				: void(0)
			;

			var hgserver = (getHgServerProxy) ? getHgServerProxy() : void(0);

			var rv = function(request) {
				//Packages.java.lang.System.err.println("Mock Bitbucket request: " + request.method + " " + request.path);
				if (request.headers.value("host") == "bitbucket.org" || o.loopback) {
					if (request.path == "") {
						return {
							status: {
								code: 200
							},
							body: {
								type: "text/javascript",
								string: "print('Hello, World! from mock Bitbucket')"
							}
						}
					}
					var Sourceroot = function(root) {
						var loader = new jsh.file.Loader({ directory: root.directory });
						var HEAD = null;
						var required;
						if (root.access) {
							required = jsh.http.Authentication.Basic.Authorization(root.access);
							debugger;
						}
						this.get = function(body,tokens) {
							var type = tokens.shift();
							if (type == "raw") {
								var version = tokens.shift();
								if (version == "local") {
									var authorization = request.headers.value("Authorization");
									if (required && required != authorization) {
										return {
											status: {
												code: 401
											}
										};
									}
									var path = tokens.join("/");
									var pathname = root.directory.getRelativePath(path);
									if (pathname.file) {
										//Packages.java.lang.System.err.println("File: " + pathname);
										return {
											status: {
												code: 200
											},
											body: (body) ? loader.get(path) : HEAD
										}
									} else if (pathname.directory) {
										//Packages.java.lang.System.err.println("Directory: " + pathname);
										return {
											status: {
												code: 200
											},
											body: (body) ? {
												type: "text/plain",
												string: (function() {
													return pathname.directory.list({ type: pathname.directory.list.ENTRY }).map(function(entry) {
														//Packages.java.lang.System.err.println("Path: " + entry.path);
														return entry.path.replace(String(Packages.java.io.File.separator),"/");
													}).filter(function(path) {
														return path != ".hg/";
													}).join("\n");
												})()
											} : HEAD
										}
									} else {
										return {
											status: {
												code: 404
											}
										}
										//Packages.java.lang.System.err.println("Not found: " + pathname);
									}
								}
							}
						}
					}
					var tokenized = request.path.split("/");
					if (tokenized.slice(0,3).join("/") == "api/1.0/repositories" || tokenized[2] == "raw") {
						var user;
						var repository;
						if (tokenized.slice(0,3).join("/") == "api/1.0/repositories") {
							tokenized.shift();
							tokenized.shift();
							tokenized.shift();
						}
						user = tokenized[0];
						repository = tokenized[1];
						tokenized.shift();
						tokenized.shift();
						if (o.src[user] && o.src[user][repository]) {
							var body = (request.method == "GET");
							//jsh.shell.console("tokenized = " + tokenized);
							return new Sourceroot(o.src[user][repository]).get(body, tokenized);
						} else {
							throw new Error("No definition for repository " + user + "/" + repository);
						}
					} else if (tokenized[2] == "downloads") {
						if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]]) {
							var downloads = o.src[tokenized[0]][tokenized[1]].downloads;
							var file = tokenized[3];
							if (downloads && downloads[file]) {
								return {
									status: { code: 200 },
									body: {
										stream: downloads[file].read(jsh.io.Streams.binary)
									}
								}
							}
						}
					} else if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]] && tokenized[2] == "get") {
						//	TODO	is this included in hgweb server?
						var SRC = o.src[tokenized[0]][tokenized[1]];
						if (tokenized[3] == "local.zip") {
							try {
								var buffer = new jsh.io.Buffer();
								var to = buffer.writeBinary();
								var list = SRC.directory.list({
									filter: function(node) {
										if (node.pathname.basename == ".hg") return false;
										return true;
									},
									descendants: function(dir) {
										if (dir.pathname.basename == ".hg") return false;
										return true;
									},
									type: SRC.directory.list.ENTRY
								});
								jsh.file.zip({
									from: list.map(function(entry) {
										if (entry.node.directory) {
											var path = (entry.path) ? entry.path.substring(0,entry.path.length-1).replace(/\\/g, "/") : "";
											return {
												directory: "slimelocal/" + path
											}
										}
										var rv = {
											path: "slimelocal/" + entry.path.replace(/\\/g, "/")
										};
										Object.defineProperty(rv, "stream", {
											get: function() {
												return entry.node.read(jsh.io.Streams.binary);
											}
										});
										return rv;
									}),
									to: to
								});
								buffer.close();
								return {
									status: { code: 200 },
									body: {
										type: "application/zip",
										stream: buffer.readBinary()
									}
								};
							} catch (e) {
								jsh.shell.console("Error: " + e);
								jsh.shell.console("Stack: " + e.stack);
								throw e;
							}
						}
					} else if (getHgServerProxy && o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]]) {
						// Packages.java.lang.System.err.println("Forwarding hg server request: " + request.method + " " + request.path);
						//	forward to delegate server
						var delegate = hgserver;
						// Packages.java.lang.System.err.println("Got hg server proxy");
						return delegate(request);
					} else {
						jsh.shell.console("Unhandled: " + tokenized.join("/"));
						return {
							status: { code: 598 }
						}
					}
				}
			};
			rv.stop = function() {
				if (hgserve) hgserve.stop();
			};
			return rv;
		};

		$export(MockBitbucketApi);
	}
//@ts-ignore
)(Packages,$api,$context,$export);
