//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		jsh.debug = $loader.module("module.js");

		var Dumper = function(indent,p) {
			var getTitle = function(data) {
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
				return title;
			}

			this.child = function() {
				return new Dumper(indent + p.indent, p);
			}

			this.dump = function(data) {
				if (data.calls > 0) {
					debugger;
					p.log(indent + "Calls: " + data.calls + " elapsed: " + String( (data.elapsed / 1000).toFixed(3) )
						+ " average: " + String( (data.elapsed / data.calls / 1000).toFixed(6) ) + " " + getTitle(data)
					);
				} else {
					p.log(indent + "Calls: " + data.calls + " " + getTitle(data));
				}
			}
		}

		jsh.debug.profile.cpu = (function(f) {
			var JshProfile = function(delegate) {
				for (var x in delegate) {
					this[x] = delegate[x];
				}

				//	wrap jsh.debug.profile.dump: it used to take a mode argument with indent and log properties, and we
				//	accept those, create an appropriate dumper from them, and call the underlying new jsh.debug.profile.dump
				this.dump = (function(f) {
					return function(p) {
						if (p.indent && p.log) {
							//	TODO	use $api.deprecate? Would it work in a plugin?
							debugger;
							return f.call(this, new Dumper("", p));
						} else {
							return f.call(this, p);
						}
					}
				})(this.dump);
			}

			return function() {
				return new JshProfile(f.apply(this,arguments));
			}
		})(jsh.debug.profile.cpu);

		jsh.debug.disableBreakOnExceptionsFor = function(f) {
			return function() {
				var enabled = $host.getDebugger().isBreakOnExceptions();
				if (enabled) {
					$host.getDebugger().setBreakOnExceptions(false);
				}
				try {
					return f.apply(this,arguments);
				} finally {
					if (enabled) {
						$host.getDebugger().setBreakOnExceptions(true);
					}
				}
			}
		}
	}
})