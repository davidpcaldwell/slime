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

$exports.subprocess = function() {
	return new function() {
		this.start = function(scenario) {
			jsh.shell.echo(JSON.stringify({ start: { scenario: { name: scenario.name } } }));
		};

		var jsonError = function(error) {
			if (error) {
				return {
					type: error.type,
					message: error.message,
					stack: error.stack
				}
			} else {
				return void(0);
			}
		}

		this.test = function(result) {
			jsh.shell.echo(JSON.stringify({
				test: {
					success: result.success,
					message: result.message,
					error: jsonError(result.error)
				}
			}));
		}

		this.end = function(scenario,success) {
			jsh.shell.echo(JSON.stringify({ end: { scenario: { name: scenario.name }, success: success }}));
		}
	}
};

$exports.Parent = function(p) {
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
//			lock.Waiter({
//				until: function() {
//					if (queued.length && stack[stack.length-1] == self) {
//						var action = queued.shift();
//						if (action.start) {
//							jsh.shell.echo("Processing start: " + self + t());
//							var scenario = new Scenario(action.start.scenario);
////							stack.push(scenario);
//							scope.scenario(scenario);
//						} else if (action.test) {
//							jsh.shell.echo("Processing test: " + self + t());
//							scope.test(action.test);
//						} else if (action.end) {
//							jsh.shell.echo("Processing end: " + self + t());
//							ended = true;
//						} else {
//							jsh.shell.echo("Action: " + JSON.stringify(action));
//						}
//					} else if (!ended) {
//						if (!queued.length) {
//							jsh.shell.echo("Nothing queued: " + self + t());
//						} else {
//							jsh.shell.echo("Not target: " + self + t() + " target is " + stack[stack.length-1]);
//						}
//					} else {
//						jsh.shell.echo("Ended already: " + self);
//					}
//					return ended;
//				},
//				then: function() {
//					var last = stack.pop();
//					jsh.shell.echo("Popped " + last + " off stack; self = " + self);
//					jsh.shell.echo("New last = " + stack[stack.length-1]);
//					if (last != self) {
//						jsh.shell.echo("Warning: last " + last + " self " + self);
//					}
//				}
//			})();
//			lock.Waiter({
//				until: function() {
//					return true;
//				},
//				then: function() {
//
//				}
//			})();
//			jsh.shell.echo("ended: " + this + t() + " with top of stack " + stack[stack.length-1]);
		}
	};

	var top = new Scenario({
		name: p.name
	},true);

	this.top = top;

	jsh.java.Thread.start(function() {
		p.stream.character().readLines(function(line) {
			lock.Waiter({
				until: function() {
//					jsh.shell.echo("Trying to proceed with line" + t());
					return Boolean(top.scope);
				},
				then: function() {
//					jsh.shell.echo("Got line: " + line + t());
					try {
						if (line.substring(0,1) == "{") {
							var json = JSON.parse(line);
							queue(json);
						}
					} catch (e) {
						Packages.java.lang.System.err.println(e);
						Packages.java.lang.System.err.println(e.stack);
					}
				}
			})();
		});
		lock.Waiter({
			until: function() {
				return true;
			},
			then: function() {
				top.done();
			}
		})();
	});
}