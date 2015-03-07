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
				success: result.success,
				message: result.message,
				error: jsonError(result.error)
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
	
	var Scenario = function(json) {
		var ended = false;
		
		stack.push(this);
		
		this.toString = function() {
			return "console.stdio.js scenario: " + json.name;
		}
		
		this.name = json.name;
		
		this.end = function() {
			lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					ended = true;
				}
			})();
		}
		
		this.execute = function(scope) {
			jsh.shell.echo("Executing a scenario: " + this + t());
			var self = this;
			lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					jsh.shell.echo("Setting scope for " + this + t());
					self.scope = scope;
				}
			})();
			jsh.shell.echo("Waiting until end received: " + this + t());
			lock.Waiter({
				until: function() {
					return ended;
				},
				then: function() {					
				}
			})();
		}
	};
	
	var top = new Scenario({
		name: p.name
	});
	
	this.top = top;
	
	jsh.java.Thread.start(function() {
		p.stream.character().readLines(function(line) {
			lock.Waiter({
				until: function() {
					jsh.shell.echo("Trying to proceed with line" + t());
					return Boolean(top.scope);
				},
				then: function() {
					jsh.shell.echo("Got line: " + line + t());
					try {
						if (line.substring(0,1) == "{") {
							var json = JSON.parse(line);
							var last = (stack.length) ? stack[stack.length-1] : null;
							if (json.start) {
								jsh.shell.echo("start" + t());
								if (last) {
									var scenario = new Scenario(json.start.scenario);
									stack.push(scenario);
									throw new Error("This has to be in separate thread, you idiot")
									last.scope.scenario(scenario);
								} else {
									stack.push(top);
								}
								jsh.shell.echo("processed start" + t())
							} else if (json.end) {
								jsh.shell.echo("end");
								stack.pop().end();
							} else if (json.test) {
								jsh.shell.echo("test");
								last.scope.test(json.test);
							}
						}
					} catch (e) {
						Packages.java.lang.System.err.println(e);
						Packages.java.lang.System.err.println(e.stack);
					}
				}
			})();
		});
	});
}