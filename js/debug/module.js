//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	no apparent dependency on Rhino, let alone jsh; should this be available to all execution environments?

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

var cpu;

var decoratedObjects = [];

//	environment:
//		getCurrent: node that currently applies to this profiling context
var decorate = function(p,label) {
	if (typeof(p) == "function") {
		var f = p;
		var rv = function() {
			var next = cpu.profiles.current().getCurrent().getNodeFor(f,label);
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
				//	Also adds decoration to the return value of this function
				if (typeof(rv) == "object" && rv != null) {
					if (decoratedObjects.indexOf(rv) == -1) {
						decorate(rv);
						decoratedObjects.push(rv);
					}
				}
				return rv;
			} finally {
				next.stop();
			}
		}
		//	Copy function properties
		for (var x in f) {
			rv[x] = f[x];
		}
		return rv;
	} else if (typeof(p) == "object") {
		var o = p;
		for (var x in o) {
			if (typeof(o[x]) == "function") {
				//	TODO	allow context to filter objects, or maybe functions, to not be filtered
				try {
					if (label) {
						o[x] = decorate(o[x],label+"."+x);
					} else {
						o[x] = decorate(o[x]);
					}
				} catch (e) {
					//	Function is not assignable
				}
			}
			//	TODO	decorate nested properties?
		}
	}
}

var Profile = function() {
	//	TODO	Does not really work with threading

	var Node = function(p,parent) {
		var stopwatch = new Stopwatch();
		var children = [];
		var calls = 0;

		//	TODO	could not we use an object rather than an array? Granted the source would be an unconventional index, but
		//			should work ... could also use key/label combination
		var getNodeFor = function(key) {
			for (var i=0; i<children.length; i++) {
				if (children[i].key == key) {
					return children[i].node;
				}
			}
			return null;
		}

		this.getNodeFor = function(f,label) {
			var key = String(f);
			var rv = getNodeFor(key);
			if (rv == null) {
				rv = new Node(f,this);
				children.push({ f: f, key: String(f), node: rv });
			}
			if (label) {
				rv.label = label;
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
			rv.label = this.label;
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

	this.getCurrent = function() {
		return current;
	}

	this.add = function(o) {
		return decorate(o);
	}

	this.getData = function() {
		return top.getData(new Date());
	}

	var dump = function(data,dumper) {
		var recurse = arguments.callee;
		dumper.dump(data);
		if (data.children) {
			data.children.sort(function(a,b) {
				return b.elapsed - a.elapsed;
			});
			data.children.forEach( function(child) {
				recurse(child,dumper.child());
			});
		}
	}

	this.dump = function(dumper) {
		dump(this.getData(),dumper);
	}
}

$exports.profile = new function() {
	this.cpu = function() {
		if (!cpu) {
			cpu = (function() {
				if ($context.cpu) {
					return $context.cpu({ Profile: Profile });
				} else {
					return new function() {
						var profile;

						this.profiles = new function() {
							this.current = function() {
								if (!profile) {
									profile = new Profile();
								}
								return profile;
							}

							this.all = function() {
								return [ {
									id: "<only>",
									profile: (profile) ? profile : new Profile()
								} ];
							}
						}
					}
				}
			})();
		}
		for (var i=0; i<arguments.length; i++) {
			decorate(arguments[i]);
		}
		return cpu;
	}
	this.cpu.add = function(p,label) {
		if (cpu) {
			return decorate(p,label);
		} else {
			return p;
		}
	}
	//	TODO	a dumper should optionally re-set profiling data; perhaps there should be another way to do that, too
	this.cpu.dump = function(dumper) {
		if (cpu) {
			cpu.profiles.current().dump(dumper);
		}
	}
	this.cpu.dump.all = function(dumper) {
		if (cpu) {
			cpu.profiles.all().forEach(function(profile) {
				if (dumper.start) {
					dumper.start(profile.id);
				}
				profile.profile.dump.call(profile.profile,dumper);
			});
		}
	}

	this.add = function() {
		debugger;
		return this.cpu.add.apply(this.cpu,arguments);
	}
}