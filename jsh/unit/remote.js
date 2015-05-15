//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	The 'top' member of this implementation can be used as an argument to the Scenario constructor; it then needs to be fed
//	information via the queue() method, and then the finish() method.
var Remote = function(p) {
	var stack = [];

	var lock = new $context.api.java.Thread.Monitor();

	var t = function() {
		return " " + Packages.java.lang.Thread.currentThread().getName();
	}

	var queued = [];

	var queue = function(json) {
		lock.Waiter({
			until: function() {
				return true;
			},
			then: function() {
				queued.push(json);
			}
		})();
	}

	var Scenario = function(json,top) {
		var ended = false;

		stack.push(this);

		this.toString = function() {
			return "Remote scenario: " + json.name;
		}

		this.name = json.name;

		var self = this;

		var done = false;

		this.done = function() {
			lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					done = true;
				}
			})();
		}

		this.execute = function(scope) {
			lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					self.scope = scope;
				}
			})();
			var more = true;
			while(more) {
				lock.Waiter({
					until: function() {
						return Boolean(queued.length) || done;
					},
					then: function() {
						if (done) {
							more = false;
							return;
						}
						var event = queued.shift();
						var action = event.detail;
						if (event.type == "scenario" && action.start) {
							var scenario = new Scenario(action.start);
							scope.scenario(scenario);
						} else if (event.type == "test") {
							scope.test((function(result) {
								return function() {
									return result;
								};
							})(action));
						} else if (event.type == "scenario" && action.end) {
							more = false;
						}
					}
				})();
			}
		}
	};

	var top = new Scenario({
		name: p.name
	},true);

	this.top = top;

	this.queue = function(event) {
		lock.Waiter({
			until: function() {
				return Boolean(top.scope);
			},
			then: function() {
				queue(event);
			}
		})();
	};

	this.finish = function() {
		lock.Waiter({
			until: function() {
				return true;
			},
			then: function() {
				top.done();
			}
		})();
	}
};

$exports.Events = function(o) {
	var monitor = new $context.api.java.Thread.Monitor();
	var top;
	var queue = [];

	var Scenario = function Scenario(detail) {
		//Packages.java.lang.System.out.println("Event: " + JSON.stringify(detail));
		this.name = detail.start.name;

		this.execute = function(scope) {
			var more = true;
			var rv;
			while(more) {
				monitor.Waiter({
					until: function() {
						return queue.length;
					},
					then: function() {
						var e = queue.shift();
						//Packages.java.lang.System.out.println("Processing: " + JSON.stringify(e));
						if (e.type == "scenario" && e.detail.start) {
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

	o.source.listeners.add("scenario", received);
	o.source.listeners.add("test", received);

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

$exports.Remote = Remote;

$exports.Parent = function(p) {
	Remote.call(this,p);
	var remote = new $context.api.unit.JSON.Decoder();
	var self = this;
	remote.listeners.add("scenario", function(e) {
		self.queue(e);
	});
	remote.listeners.add("test", function(e) {
		self.queue(e);
	});

	$context.api.java.Thread.start(function() {
		p.stream.character().readLines(function(line) {
			if (line.substring(0,1) == "{") {
				remote.decode(line);
			}
		});
		self.finish();
	});
}