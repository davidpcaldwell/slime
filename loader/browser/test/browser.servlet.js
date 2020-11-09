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
	 * @param { { httpd: slime.servlet.httpd } } $context
	 * @param { (value: (configuration: { url: string }) => slime.servlet.handler) => void } $export
	 */
	function(jsh,$context,$export) {
		var httpd = $context.httpd;
		jsh.shell.console("Loading browser servlet ...");
		var lock = new jsh.java.Thread.Monitor();
		var result;

		var createHandler = function(configuration) {
			/** @type { slime.servlet.handler } */
			function handle(request) {
				//	This disables reloading for unit tests; should find a better way to do this rather than just ripping out the method
				if (httpd.$reload) delete httpd.$reload;
				if (request.path == configuration.url) {
					if (request.method == "POST") {
						jsh.shell.console("Receiving POSTed results ...");
						//	TODO	perhaps need better concurrency construct, like Notifier
						var notifier = new lock.Waiter({
							until: function() {
								return true;
							},
							then: function() {
								result = JSON.parse(request.body.stream.character().asString());
								return {
									status: {
										code: 200
									}
								};
							}
						});
						return notifier();
					} else if (request.method == "GET") {
						jsh.shell.console("Received GET request for results; blocking on " + lock);
						var waitForResult = new lock.Waiter({
							until: function() {
								return typeof(result) != "undefined";
							},
							then: function() {
								return {
									status: {
										code: 200
									},
									body: {
										type: "application/json",
										string: JSON.stringify(result, void(0), "    ")
									}
								};
							}
						});
						return waitForResult();
					}
				}
			}

			return handle;
		}

		$export(createHandler);
	}
//@ts-ignore
)(jsh,$context,$export);
