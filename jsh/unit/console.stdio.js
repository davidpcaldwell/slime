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

//$exports.subprocess = function() {
//	return new function() {
//		this.start = function(scenario) {
//			jsh.shell.echo(JSON.stringify({ start: { scenario: { name: scenario.name } } }));
//		};
//
//		var jsonError = function(error) {
//			if (error) {
//				return {
//					type: error.type,
//					message: error.message,
//					stack: error.stack
//				}
//			} else {
//				return void(0);
//			}
//		}
//
//		this.test = function(result) {
//			jsh.shell.echo(JSON.stringify({
//				test: {
//					success: result.success,
//					message: result.message,
//					error: jsonError(result.error)
//				}
//			}));
//		}
//
//		this.end = function(scenario,success) {
//			jsh.shell.echo(JSON.stringify({ end: { scenario: { name: scenario.name }, success: success }}));
//		}
//	}
//};

//	The 'top' member of this implementation can be used as an argument to the Scenario constructor; it then needs to be fed
//	information via the queue() method, and then the finish() method.
var Receiver = function(p) {
	var stack = [];

	var lock = new jsh.java.Thread.Monitor();

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
			return "console.stdio.js scenario: " + json.name;
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
						var action = queued.shift();
						if (action.start) {
							var scenario = new Scenario(action.start.scenario);
							scope.scenario(scenario);
						} else if (action.test) {
							scope.test((function(result) {
								return function() {
									return result;
								};
							})(action.test));
						} else if (action.end) {
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

	this.queue = function(json) {
		lock.Waiter({
			until: function() {
				return Boolean(top.scope);
			},
			then: function() {
				queue(json);
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

$exports.Receiver = Receiver;

$exports.Parent = function(p) {
	Receiver.call(this,p);
	var queue = this.queue;
	var finish = this.finish;
	jsh.java.Thread.start(function() {
		p.stream.character().readLines(function(line) {
			if (line.substring(0,1) == "{") {
				queue(JSON.parse(line));
			}
		});
		finish();
	});
}