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

//@ts-check
(
	/**
	 * @param { { java: jsh["java"], shell: jsh["shell"] } } jsh
	 * @param { slime.servlet.httpd } httpd
	 * @param { { url: string } } $parameters
	 * @param { slime.servlet.Script } $exports
	 */
	function(jsh,httpd,$parameters,$exports) {
		jsh.shell.console("Loading browser servlet ...");
		var lock = new jsh.java.Thread.Monitor();
		var success;

		$exports.handle = function(request) {
			//	This disables reloading for unit tests; should find a better way to do this rather than just ripping out the method
			if (httpd.$reload) delete httpd.$reload;
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
								success = string;
							} else if (string == "false") {
								success = string;
							} else if (string.length == 0) {
								success = "null";
							} else {
								success = string;
							}
		//					jsh.shell.echo("server side success = " + success + "; returning 200 for POST and unblocking on " + lock);
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
									string: success
								}
							};
						}
					});
					return waiter();
				}
			}
		};
	}
//@ts-ignore
)(jsh,httpd,$parameters,$exports);
