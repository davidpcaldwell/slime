//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.unit.internal.remote.Context } $context
	 * @param { slime.jsh.unit.internal.remote.Exports } $exports
	 */
	function($api,$context,$exports) {
		//	The 'top' member of this implementation can be used as an argument to the Scenario constructor; it then needs to be fed
		//	information via the queue() method, and then the finish() method.
		$exports.Events = function(o) {
			var monitor = new $context.api.java.Thread.Monitor();
			var top;
			var queue = [];
			var source = (function() {
				if (o.source) return o.source;
				if (o.events) return new function() {
					var events = $api.Events({ source: this });

					this.fire = function() {
						o.events.forEach(function(event) {
							events.fire(event.type,event.detail);
						},this);
					}
				};
			})();

			var Scenario = function Scenario(detail) {
				//Packages.java.lang.System.out.println("Event: " + JSON.stringify(detail));
				this.name = detail.start.name;

				this.execute = function(scope) {
					var more = true;
					var rv;
					while(more) {
						monitor.Waiter({
							until: function() {
								return Boolean(queue.length);
							},
							then: function() {
								var e = queue.shift();
								//Packages.java.lang.System.out.println("Processing: " + JSON.stringify(e));
								if (e.type == "scenario" && e.detail.start) {
									if (!scope.scenario) throw new Error("keys = " + Object.keys(scope));
									scope.scenario(new Scenario(e.detail));
								} else if (e.type == "scenario" && e.detail.end) {
									rv = e.detail.success;
									more = false;
								} else if (e.type == "test") {
									scope.test(function(result) {
										return e.detail;
									});
								}
							}
						})();
					}
				}
			}

			var received = function(e) {
				monitor.Waiter({
					until: function() {
						return true;
					},
					then: function() {
						//Packages.java.lang.System.out.println("Received: " + JSON.stringify(e));
						if (!top && e.type == "scenario" && e.detail.start) {
							top = new Scenario(e.detail);
						} else {
							queue.push(e);
						}
					}
				})();
			}

			source.listeners.add("scenario", received);
			source.listeners.add("test", received);

			if (o.events) {
				$context.api.java.Thread.start(function() {
					source.fire();
				})
			}

			var name = (o.name) ? o.name : "Event scenario: unstarted";

			Object.defineProperty(this, "name", {
				get: function() {
					return name;
				},
				enumerable: true
			});

			this.execute = function(scope) {
				monitor.Waiter({
					until: function() {
						return top;
					},
					then: function() {
					}
				})();
				name = top.name;
				return top.execute(scope);
			};
		};

		$exports.Decoder = function(o) {
			var decoder = new $context.api.unit.JSON.Decoder();

			decoder.listeners.add("scenario", o.received);
			decoder.listeners.add("test", o.received);

			this.run = function() {
				o.stream.character().readLines(function(line) {
					if (line.substring(0,1) == "{") {
						decoder.decode(line);
					}
				});
			}
		}

		$exports.Stream = function(o) {
			var decoder = new $context.api.unit.JSON.Decoder();
			var scenario = new $exports.Events({
				name: o.name,
				source: decoder
			});
			$context.api.java.Thread.start(function() {
				o.stream.character().readLines(function(line) {
					if (line.substring(0,1) == "{") {
						decoder.decode(line);
					}
				});
			});
			return scenario;
		}
	}
//@ts-ignore
)($api,$context,$exports);
