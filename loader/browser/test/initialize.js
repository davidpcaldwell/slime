//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for web browsers.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

document.domain = document.domain;

(function() {
	var forEach = function(array,f) {
		if (array.forEach) {
			array.forEach(f);
		} else {
			//	Array.prototype.forEach not present in IE8
			for (var i=0; i<array.length; i++) {
				f(array[i]);
			}
		}
	}

	var Asynchrony = function() {
		var Promise = window.Promise;
		var next = arguments[0];
		var pending = [];

		this.toString = function() {
			return pending.map(function(o) {
				if (String(o) == "[object Object]") return "keys = " + Object.keys(o);
				return String(o);
			}).join("\n");
		}

		this.next = function(then) {
			next = then;
		};

		this.set = $api.deprecate(function(then) {
			next = then;
		});

		this.get = $api.deprecate(function() {
			return this;
		});

		this.length = $api.deprecate(function() {
			return pending.length;
		});

		this.open = function() {
			return pending.length > 0;
		}

		this.started = function(process) {
			console.log("Started: " + process + " from " + arguments.caller);
			pending.push(process);
		};

		var controlled;

		this.finished = function(process) {
			console.log("Finished: " + process);
			pending.splice(pending.indexOf(process),1);
			console.log("still pending = " + pending.length);
			console.log(pending.join("\n"));
			if (pending.length == 0) {
				if (next) next();
				if (controlled) {
					var toResolve = controlled;
					controlled = void(0);
					toResolve.resolve();
				}
			}
		};

		if (window.Promise) {
			var Controllable = function() {
				var resolveIt;
				
				var promise = new Promise(function(resolve,reject) {
					resolveIt = resolve;
				});
				
				this.then = function() {
					return promise.then.apply(promise,arguments);
				}
				
				this.resolve = function(value) {
					resolveIt(value);
				}
			};
			
			this.promise = function() {
				controlled = new Controllable();
				return controlled;
			};			
		}
	};

	var asynchrony = new Asynchrony();

	var Network = function() {
	};

	window.XMLHttpRequest = (function(before) {
		var network = new Network();

		var rv = function() {
			var Self = arguments.callee;
			if (typeof(Self.open) == "undefined") {
				Self.open = {
					push: function(process) {
						debugger;
						asynchrony.started(process);
					}
				};
				Self.closed = function(self) {
					debugger;
					asynchrony.finished(self);
				}
			}
			var self = this;

			//	TODO	There are other properties and methods that are not implemented, but these are sufficient for now.
			//			See http://www.w3.org/TR/XMLHttpRequest/

			var delegate = new before();

			var updateProperties = function() {
				var properties = ["readyState", "status", "responseXML", "responseText"];
				forEach(properties, function(property) {
					if (property == "status" && self.readyState == 1) {
						//	TODO	do nothing, but why?
					} else {
						try {
							self[property] = delegate[property];
						} catch (e) {
							//	could not access property, leave it as previous value; this happens in IE7 when object has not been
							//	opened
						}
					}
				});
			}

			//	Unclear whether this 'already' is actually necessary
			var already = false;
			delegate.onreadystatechange = function() {
				updateProperties();
				if (self.onreadystatechange) {
					self.onreadystatechange.apply(self, arguments);
				} else {
				}
				if (self.readyState == 4 && !synchronous) {
					if (!already) {
						already = true;
						asynchrony.finished(self);
					}
				}
			};

			var delegated = ["open", "setRequestHeader", "getResponseHeader", "getAllResponseHeaders", "send"];
			forEach(delegated, function(methodName) {
				self[methodName] = (function(methodName) {
					return function() {
						var invoker = function(name,arguments) {
							var args = [];
							for (var i=0; i<arguments.length; i++) {
								args[i] = "arguments[" + i + "]";
							}
							var rv;
							var code = "rv = delegate." + name + "(" + args.join(",") + ")";
							eval(code);
							return rv;
						}

						if (!delegate[methodName]) throw new Error("Not found: method " + methodName + " of XMLHttpRequest");
						if (delegate[methodName].apply) {
							return delegate[methodName].apply(delegate,arguments);
						} else {
							//	for some reason, IE does not allow calling these methods via apply
							return invoker(methodName,arguments);
						}
					}
				})(methodName);
			});

			var synchronous = false;

			var string;

			this.toString = function() {
				if (string) return "XMLHttpRequest: " + string;
				return "XMLHttpRequest (unopened)";
			}

			self.open = (function(was) {
				return function(method,url) {
					string = method + " " + url;
					return was.apply(this,arguments);
				}
			})(self.open);

			var decorateWithNotice = function(method) {
				return function() {
					if (arguments[2]) {
						asynchrony.started(self);
					} else {
						synchronous = true;
					}
					return method.apply(this, arguments);
				};
			};
			self.open = decorateWithNotice(self.open);

			var decorateWithResult = function(method) {
				//	TODO	when simulating offline, this method should throw an exception if it is synchronous; if it is
				//			asynchronous, it should either immediately fire onreadystatechange with 4 and a status of 0, or it
				//			should use window.setTimeout to do so
				return function() {
					if (network == null) {
						self.readyState = 4;
						self.status = 0;
						self.responseText = "";
						self.responseXML = null;
						if (synchronous) {
							throw new Error("Mock network error");
						} else {
							window.setTimeout(function() {
								self.onreadystatechange.apply(self,{});
								asynchrony.finished(self);
							},0);
							return;
						}
					}
					var rv = method.apply(this, arguments);
					if (synchronous) {
						updateProperties();
					}
					return rv;
				};
			};
			self.send = decorateWithResult(self.send);
		};
		rv.network = {};
		rv.network.normal = function() {
			network = new Network();
		};
		rv.network.offline = function() {
			network = null;
		};
		//	TODO	use defineProperty below?
		rv.asynchrony = asynchrony;
		return rv;
	})(window.XMLHttpRequest);
	
	if (window.Promise) {
		window.Promise = (function(was) {
			return function(executor) {
				var delegate = new was(executor);
				asynchrony.started(this);
				
				var end = (function() {
					if (asynchrony) asynchrony.finished(this);
				}).bind(this);

				this.then = function(resolved,rejected) {
					var args = [];
					args.push(function() {
						var rv = resolved.apply(null,arguments);
						end();
						return rv;
					});
					if (rejected) args.push(function() {
						var rv = rejected.apply(null,arguments);
						end();
						return rv;
					});						
					return delegate.then.apply(delegate,args);
				};
				
				this.catch = function(rejected) {
					var rv = delegate.catch.apply(null,arguments);
					end();
					return rv;
				};
			}
		})(window.Promise)
	}

	if (!window.alert.jsh) window.alert = function(string) {
		if (window.console) window.console.log("Alert: " + string);
	};
})();
