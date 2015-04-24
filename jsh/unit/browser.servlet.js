//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	remove direct jsh references from this file

var lock = new jsh.java.Thread.Monitor();
var consoleLock = new jsh.java.Thread.Monitor();
var success;

//var delegate = (function() {
//	var scope = {
//		$exports: {},
//		httpd: httpd,
//		$parameters: $parameters,
//		$loader: new httpd.io.Loader({
//			resources: new function() {
//				var prefix = $parameters.delegate.split("/").slice(0,-1).join("/") + "/";
//
//				this.get = function(path) {
//					return httpd.loader.resource(prefix + path);
//				}
//			}
//		})
//	};
//	jsh.shell.echo("Running: " + $parameters.delegate);
//	httpd.loader.run($parameters.delegate, scope);
//	return scope.$exports;
//})();

var console = [];

$exports.handle = function(request) {
	//	This disables reloading for unit tests; should find a better way to do this rather than just ripping out the method
	if (httpd.$reload) delete httpd.$reload;
	if (request.path == "coffee-script.js") {
		if ($parameters.coffeescript) {
			return {
				status: { code: 200 },
				body: {
					type: "text/javascript",
					string: $parameters.coffeescript.file.read(String)
				}
			}
		} else {
			return {
				status: { code: 404 },
				body: {
					type: "text/plain",
					string: "No $parameters.coffeescript"
				}
			}
		}
	}
	if (request.path == $parameters.url.split("/").slice(0,-1).join("/") + "/console") {
		if (request.method == "POST") {
			var body = JSON.parse(request.body.stream.character().asString());
			body.forEach(function(entry) {
				if (!entry.close) {
					console.push(entry);
				} else {
					new consoleLock.Waiter({
						until: function() {
							return true;
						},
						then: function() {
							jsh.shell.echo("Unblocking console lock.");
							console.finished = true;
						}
					})();
				}
			});
			return {
				status: {
					code: 200
				}
			};
		} else if (request.method == "GET") {
			new consoleLock.Waiter({
				until: function() {
					return console.finished;
				},
				then: function() {
				}
			})();
			return {
				status: {
					code: 200
				},
				body: {
					type: "application/json",
					string: JSON.stringify(console)
				}
			};
		}
	}
	if (request.path == $parameters.url) {
		if (request.method == "POST") {
			debugger;
			//	TODO	perhaps need better concurrency construct, like Notifier
			var waiter = new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					debugger;
					var string = request.body.stream.character().asString();
					if (string == "true") {
						success = true;
					} else if (string == "false") {
						success = false;
					} else if (string.length == 0) {
						success = null;
					} else {
						throw new Error("success = " + string);
					}
					jsh.shell.echo("server side success = " + success + "; returning 200 for POST and unblocking on " + lock);
					return {
						status: {
							code: 200
						}
					};
				}
			});
			return waiter();
		} else if (request.method == "GET") {
			jsh.shell.echo("Received GET request for " + request.path + "; blocking on " + lock);
			var waiter = new lock.Waiter({
				until: function() {
					return typeof(success) != "undefined";
				},
				then: function() {
					return {
						status: {
							code: 200
						},
						body: {
							type: "application/json",
							string: String(success)
						}
					};
				}
			});
			return waiter();
		}
	};

	var handle = function(request) {
		var resource = httpd.loader.resource(request.path);
		jsh.shell.echo("browser.modules.js mapping " + request.path + " = " + resource);
		if (resource) {
			var type;
			//	TODO	wire this into servlet container MIME type specification
			if (false) {

			} else if (/\.html$/.test(request.path)) {
				type = "text/html";
			} else if (/\.js$/.test(request.path)) {
				//	TODO	check for correctness
				type = "application/javascript";
			} else if (/\.coffee$/.test(request.path)) {
				//	TODO	check for correctness
				type = "text/coffeescript";
			} else {
				throw new Error("Unknown type: " + request.path);
			}
			return {
				status: {
					code: 200
				},
				body: {
					type: type,
					stream: resource.read(jsh.io.Streams.binary)
				}
			};
		} else {
			return {
				status: {
					code: 404
				}
			};
		}
	};

	return handle(request);
};

$exports.destroy = function() {
	if (delegate.destroy) delegate.destroy();
}