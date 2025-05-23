//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.jrunscript.java.internal.threads.Context } $context
	 * @param { slime.jrunscript.java.internal.threads.Exports } $exports
	 */
	function(Packages,JavaAdapter,$api,$context,$exports) {
		/**
		 * @constructor
		 * @param { any } [factory]
		 */
		var Thread = function(p,factory) {
			var synchronize = (function() {
				//	This entire construct (synchronize, synchronize.lock) exists just to support join()
				var lock = new Packages.java.lang.Object();
				var rv = function(f) {
					return $context.java.sync(f,lock);
				};
				rv.lock = lock;
				return rv;
			})()

			var done = false;

			var debug = function(m) {
				$context.log.FINE(m);
			}

			var runnable = new function() {
				this.run = function() {
					try {
						debug("Running thread " + thread.getName() + " ...");
						var rv = p.call();
						debug("Finished " + p);
						if (!done) {
							synchronize(function() {
								if (p.on && p.on.result) {
									p.on.result(rv);
								}
								debug("Returned: " + thread);
								done = true;
								synchronize.lock.notifyAll();
							})();
						}
					} catch (e) {
						var error = e;
						if (!done) {
							synchronize(function() {
								if (p.on && p.on.error) {
									p.on.error(error);
								}
								debug("Threw: " + thread + " " + String(e) + "\n" + e.stack);
								done = true;
								synchronize.lock.notifyAll();
							})();
						}
					}
				}
			}

			var _runnable = new JavaAdapter(Packages.java.lang.Runnable,runnable);
			var thread = (factory) ? factory(_runnable) : new Packages.java.lang.Thread(_runnable);

			this.toString = function() {
				return "Java thread: " + thread.getName() + " factory=" + factory;
			};

			debug("Starting Java thread " + thread.getName());
			thread.start();
			debug("Started Java thread " + thread.getName());

			if (p && p.timeout) {
				debug("Starting timeout thread for " + thread + " ...");
				new Thread({
					call: function() {
						debug(thread + ": Sleeping for " + p.timeout);
						Packages.java.lang.Thread.sleep(p.timeout);
						debug(thread + ": Waking from sleeping for " + p.timeout);
						if (!done) {
							synchronize(function() {
								if (p.on && p.on.timeout) {
									p.on.timeout();
								}
								debug("Timed out: " + thread);
								done = true;
								synchronize.lock.notifyAll();
							})();
						}
					}
				});
			}

			this.join = function() {
				synchronize(function() {
					debug("Waiting for " + thread);
					while(!done) {
						debug("prewait done = " + done + " for " + thread);
						synchronize.lock.wait();
						debug("postwait done = " + done + " for " + thread);
					}
				})();
				debug("Done waiting for " + thread);
			};
		};

		$exports.setContextClassLoader = function(p) {
			if (!p) p = {};
			if (!p._thread) p._thread = Packages.java.lang.Thread.currentThread();
			if (p._classLoader) {
				p._thread.setContextClassLoader(p._classLoader);
			} else {
				$context.classpath.setAsThreadContextClassLoaderFor(p._thread);
			}
		};
		$exports.start = function(p,factory) {
			return new Thread(p,factory);
		}
		var TIMED_OUT = $api.Error.type({
			name: "JavaThreadTimeoutError",
			getMessage: function() {
				return "Timed out.";
			}
		});

		$exports.run = function(p) {
			var on = new function() {
				var result = {};

				this.result = function(rv) {
					result.returned = { value: rv };
				}

				this.error = function(t) {
					result.threw = t;
				}

				this.timeout = function() {
					result.timedOut = true;
				}

				this.evaluate = function() {
					if (result.returned) return result.returned.value;
					if (result.threw) throw result.threw;
					if (result.timedOut) throw new TIMED_OUT();
				}
			};
			var o = {};
			for (var x in p) {
				o[x] = p[x];
			}
			o.on = on;
			var t = new Thread(o);
			t.join();
			return on.evaluate();
		};
		//	TODO	make the below a subtype of Error
		$exports.run.__defineGetter__("TIMED_OUT", (function() {
			//	TODO	this indirection is necessary because Rhino debugger pauses when constructing new Error() if set to break on errors
			var cached;
			return function() {
				if (!cached) {
					cached = new Error("Timed out.");
				}
				return cached;
			}
		})());
		$exports.thisSynchronize = function(f) {
			//	TODO	deprecate when Rhino 1.7R3 released; use two-argument version of the Synchronizer constructor in a new method called
			//			synchronize()
			return $context.java.thisSynchronize(f);
		};
		$exports.Monitor = function() {
			var lock = new Packages.java.lang.Object();

			this.toString = function() {
				return "Thread.Monitor [id=" + Packages.java.lang.System.identityHashCode(lock) + "]";
			}

			var j = $context.java;

			//	TODO	repetition: this is also in Thread constructor
			var synchronize = function(f) {
				return j.sync(f, lock);
			};

			this.Waiter = function(c) {
				if (!c.until) {
					c.until = function() {
						return true;
					};
				}
				if (!c.then) {
					c.then = function() {
					};
				}
				return synchronize(function() {
					while(!c.until.apply(this,arguments)) {
						lock.wait();
					}
					var rv = c.then.apply(this,arguments);
					lock.notifyAll();
					return rv;
				});
			};
		};

		$exports.Lock = function() {
			var lock = new Packages.java.lang.Object();

			return {
				toString: function() {
					return "Thread.Lock [id=" + Packages.java.lang.System.identityHashCode(lock) + "]";
				},
				wait: function(p) {
					var when = p.when || function() { return true; };
					var then = p.then || function() { return void(0); };
					return $context.java.sync(
						function() {
							while(!when()) {
								(p.timeout) ? lock.wait(p.timeout()) : lock.wait();
							}
							var rv = then();
							lock.notifyAll();
							return rv;
						},
						lock
					);
				}
			}
		};

		$exports.Task = function(p) {
			var rv = function x(tell) {
				//	TODO	below causes TypeScript error. Unclear what this line of code does, but tests do not pass without it.
				x.p = p;
				if (tell) {
					$exports.start({
						call: function() {
							var result;
							try {
								result = { returned: p.call() }
							} catch (e) {
								result = { threw: e }
							}
							if (tell.length == 2) {
								tell(result.threw, result.returned);
							} else {
								tell(result);
							}
						}
					});
				} else {
					return p.call();
				}
			};
			rv.p = void(0);
			return rv;
		};

		/**
		 * @template { any } T
		 */
		$exports.forkJoin = function(functions) {
			/** @type { T[] } */
			var rv = functions.map(function(){ return void(0); });
			var threads = functions.map(function(f,index) {
				return $exports.start({
					call: f,
					on: {
						result: function(returned) {
							//@ts-ignore
							rv[index] = returned;
						},
						error: function(error) {
							throw error;
						}
					}
				});
			});
			threads.forEach(function(thread) {
				thread.join();
			});
			return rv;
		};

		$exports.map = function(array,mapper,target,p) {
			if (!target) target = null;
			if (!p) p = {
				callback: void(0),
				limit: void(0)
			};
			if (!p.callback) p.callback = function() {};
			var rv = [];
			var lock = new $exports.Monitor();
			var running = 0;
			var completed = 0;
			var threads = [];
			var fail = false;
			var computation = function(index) {
				return function() {
					lock.Waiter({
						until: function() {
							if (!p.limit) return true;
							return running < p.limit;
						},
						then: function() {
							running++;
						}
					})();
					var toThrow;
					try {
						rv[index] = mapper.call(target,array[index]);
					} catch (e) {
						toThrow = e;
						fail = true;
					}
					lock.Waiter({
						until: function() {
							return true;
						},
						then: function() {
							running--;
							completed++;
						}
					})();
					if (toThrow) {
						throw toThrow;
					}
				}
			};
			for (var i=0; i<array.length; i++) {
				threads.push($exports.start({
					call: computation(i),
					on: {
						//	TODO	can the below callback structure be combined with the Tell construct?
						error: (function(index) {
							return function(e) {
								fail = true;
								p.callback({ completed: completed, running: running, index: index, threw: e });
							}
						})(i),
						result: (function(index) {
							return function(rv) {
								p.callback({ completed: completed, running: running, index: index, returned: rv });
							}
						})(i)
					}
				}));
			}
			for (var i=0; i<threads.length; i++) {
				threads[i].join();
			}
			if (fail) {
				throw new Error("Failed.");
			}
			return rv;
		};

		$exports.sleep = function(milliseconds) {
			Packages.java.lang.Thread.sleep(milliseconds);
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$exports);
