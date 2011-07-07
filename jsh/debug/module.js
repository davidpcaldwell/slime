var Stopwatch = function() {
	var elapsed = 0;
	var started;

	this.start = function() {
		started = new Date();
	}

	this.stop = function() {
		var stopped = new Date();
		elapsed += (stopped.getTime() - started.getTime());
		started = null;
	}

	this.getElapsed = function(date) {
		var rv = elapsed;
		if (started) {
			rv += date.getTime() - started.getTime();
		}
		return rv;
	}
}

$exports.Profile = function(o) {
	//	TODO	Does not really work with threading
	
	var Node = function(p,parent) {
		var stopwatch = new Stopwatch();
		var children = [];
		var calls = 0;

		var getNodeFor = function(f) {
			for (var i=0; i<children.length; i++) {
				if (children[i].f == f) {
					return children[i].node;
				}
			}
			return null;
		}

		this.getNodeFor = function(f) {
			var rv = getNodeFor(f);
			if (rv == null) {
				rv = new Node(f,this);
				children.push({ f: f, node: rv });
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
				stopwatch.stop();
				current = parent;
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
			return rv;
		}
	}

	var top = new Node(o);
	
	var current = top;
	
	var decorate = function(p) {
		if (typeof(p) == "function") {
			var f = p;
			var rv = function() {
				var next = current.getNodeFor(f);
				next.start();
				try {
					//	TODO	next: decorate return values
					return f.apply(this,arguments);
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
	
	decorate(o);
	
	this.getData = function() {
		return top.getData(new Date());
	}
}