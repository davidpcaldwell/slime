var Stopwatch = function() {
	var elapsed = 0;
	var started;

	this.start = function() {
		if (!started) {
			started = new Date();
		}
	}

	this.stop = function() {
		if (started) {
			var stopped = new Date();
			elapsed += (stopped.getTime() - started.getTime());
			started = null;
		}
	}

	this.getElapsed = function(date) {
		var rv = elapsed;
		if (started) {
			rv += date.getTime() - started.getTime();
		}
		return rv;
	}
}

var Profile = function() {
	//	TODO	Does not really work with threading
	
	var Node = function(p,parent) {
		var stopwatch = new Stopwatch();
		var children = [];
		var calls = 0;

		var getNodeFor = function(key) {
			for (var i=0; i<children.length; i++) {
				if (children[i].key == key) {
					return children[i].node;
				}
			}
			return null;
		}

		this.getNodeFor = function(f) {
			var key = String(f);
			var rv = getNodeFor(key);
			if (rv == null) {
				rv = new Node(f,this);
				children.push({ f: f, key: String(f), node: rv });
			}
			return rv;
		}

		if (typeof(p) == "function") {
			this.start = function() {
				current = this;
				calls++;
				stopwatch.start();
			}

			this.stop = function() {
				if (current == this) {
					stopwatch.stop();
					current = parent;
				}
			}

			this.getElapsed = function(date) {
				return stopwatch.getElapsed(date);
			}
		} else {
			this.getElapsed = function(date) {
				var rv = 0;
				children.forEach(function(child) {
					rv += child.node.getElapsed(date);
				});
				return rv;
			}
		}

		this.getData = function(date) {
			var rv = {};
			rv.node = p;
			rv.calls = calls;
			rv.elapsed = this.getElapsed(date);
			rv.children = children.map(function(child) {
				return child.node.getData(date);
			});
			if (calls > 0 && children.length > 0) {
				var childTime = 0;
				rv.children.forEach(function(child) {
					childTime += child.elapsed;
				});
				rv.children.push(new function() {
					this.node = null;
					this.calls = calls;
					this.elapsed = rv.elapsed - childTime;
					this.children = null;
				});
			}
			return rv;
		}
	}

	var top = new Node();
	
	var current = top;
	
	var decorated = [];
	
	var decorate = function(p) {
		if (typeof(p) == "function") {
			var f = p;
			var rv = function() {
				var next = current.getNodeFor(f);
				next.start();
				try {
					var rv;
					if (this.constructor == f) {
						//	is constructor
						rv = eval("new f(" + Array.prototype.map.call(arguments,function(arg,index) { return "arguments[" + index + "]"} ).join(",") + ")");
					} else {
						rv = f.apply(this,arguments);
					}
					next.stop();
					if (typeof(rv) == "object" && rv != null) {
						if (decorated.indexOf(rv) == -1) {
							decorate(rv);
							decorated.push(rv);
						}
					}
					return rv;
				} finally {
					next.stop();
				}
			}
			for (var x in f) {
				rv[x] = f[x];
			}
			return rv;
		} else if (typeof(p) == "object") {
			var o = p;
			for (var x in o) {
				if (typeof(o[x]) == "function") {
					o[x] = decorate(o[x]);
				}
				//	TODO	decorate nested properties?
			}
		}
	}
	
	this.add = function(o) {
		return decorate(o);
	}
	
	this.getData = function() {
		return top.getData(new Date());
	}
	
	var dump = function(data,indent,mode) {
		if (!indent) indent = "";
		var recurse = arguments.callee;
		var title = (function() {
			if (typeof(data.node) == "undefined") {
				return "(top)";
			} else if (data.node == null) {
				return "(self)";
			} else if (typeof(data.node == "function")) {
				var code = String(data.node);
				code = code.split("\n").map(function(line) {
					return indent + line;
				}).slice(0,-1).join("\n")
				return code;
			} else {
				throw new Error("Unknown node type: " + data.node);
			}
		})();
		if (data.calls > 0) {
			mode.log(indent + "Calls: " + data.calls + " elapsed: " + String( (data.elapsed / 1000).toFixed(3) )
				+ " average: " + String( (data.elapsed / data.calls / 1000).toFixed(6) ) + " " + title
			);
		} else {
			mode.log(indent + "Calls: " + data.calls + " " + title);
		}
		if (data.children) {
			data.children.sort(function(a,b) {
				return b.elapsed - a.elapsed;
			});
			data.children.forEach( function(child) {
				recurse(child,indent+mode.indent,mode);
			});
		}
	}

	this.dump = function(mode) {
		dump(this.getData(),"",mode);
	}
}

$exports.profile = new function() {
	var cpu;
	
	this.cpu = function() {
		if (!cpu) {
			cpu = new Profile();
		}
		for (var i=0; i<arguments.length; i++) {
			cpu.add(arguments[i]);
		}
		return cpu;
	}
	
	this.add = function(f) {
		if (cpu) {
			return cpu.add(f);
		} else {
			return f;
		}
	}
}
