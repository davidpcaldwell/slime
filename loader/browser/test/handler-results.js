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
	 * @param { slime.runtime.browser.test.results.Context } $context
	 * @param { (value: slime.runtime.browser.test.results.Factory) => void } $export
	 */
	function($context,$export) {
		$export(function(configuration) {
			$context.library.shell.console("Creating results handler for " + configuration.url + " ...");
			var lock = new $context.library.java.Thread.Monitor();
			var result;

			/** @type { slime.servlet.handler } */
			function handle(request) {
				if (request.path == configuration.url) {
					if (request.method == "POST") {
						$context.library.shell.console("Receiving POSTed results ...");
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
						$context.library.shell.console("Received GET request for results; blocking on " + lock);
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
		});
	}
//@ts-ignore
)($context,$export);
