//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.java.internal.threads {
	export interface Context {
		java: slime.jrunscript.runtime.MultithreadedJava
		log: slime.jrunscript.java.logging.old.Logger
		classpath: any
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: slime.jrunscript.java.Script = fifty.$loader.script("module.js");
			return script({
				$slime: fifty.jsh.$slime,
				globals: false,
				logging: {
					prefix: "slime.jrunscript.host.test"
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
	}

	export interface Thread {
		/**
		 * Causes the calling thread to block and wait for this thread to terminate (either via the completion of the execution of
		 * the function or via timing out).
		 */
		join: () => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.Thread = fifty.test.Parent();
			fifty.tests.exports.Thread.object = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);


	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = test.subject;

			fifty.tests.exports.Thread.object.join = function() {
				var listener = (function() {
					return {
						returned: 0,
						errored: 0,
						expired: 0,
						result: module.Thread.thisSynchronize(function(rv) {
							this.returned++;
						}),
						error: module.Thread.thisSynchronize(function(e) {
							this.errored++;
						}),
						timeout: module.Thread.thisSynchronize(function() {
							this.expired++;
						})
					};
				})();

				var MAX = 250;
				var COUNT = 5;

				var rnd = new Packages.java.util.Random();

				var random = function() {
					return rnd.nextDouble();
				}

				verify(listener).returned.is(0);
				verify(listener).errored.is(0);
				verify(listener).expired.is(0);

				var Thread = module.Thread;

				var all = [];

				for (var i=0; i<COUNT; i++) {
					(function(i) {
						var t = Thread.start({
							call: function() {
								Packages.java.lang.Thread.sleep(MAX * random() / 2);
								return i;
							},
							on: listener
						});
						all.push(t);
					})(i)
				}

				for (var i=0; i<COUNT; i++) {
					(function(i) {
						var t = Thread.start({
							call: function() {
								Packages.java.lang.Thread.sleep(MAX * random() / 2);
								throw new Error(String(i));
							},
							on: listener
						});
						all.push(t);
					})(i);
				}

				for (var i=0; i<COUNT; i++) {
					(function(i) {
						var t = Thread.start({
							call: function() {
								Packages.java.lang.Thread.sleep(MAX * (3 + random()));
								throw new Error(String("to" + i));
							},
							timeout: MAX,
							on: listener
						});
						all.push(t);
					})(i);
				}

				for (var i=0; i<all.length; i++) {
					all[i].join();
				}

				verify(listener).returned.is(COUNT);
				verify(listener).errored.is(COUNT);
				verify(listener).expired.is(COUNT);
				var engine = String(Packages.java.lang.System.getProperty("jsh.engine"));
				verify(engine,"Engine running").is(engine);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		/**
		 * Starts a thread.
		 */
		start: {
			<T>(f: () => T, factory?: (_r: slime.jrunscript.native.java.lang.Runnable) => slime.jrunscript.native.java.lang.Thread): Thread

			<T>(p: {
				/**
				 * A function. The function will be invoked with no arguments and an undefined `this` value; if a specific
				 * calling configuration is required, a wrapper function that provides this configuration is required.
				 */
				call: () => T

				/**
				 * (optional) A timeout, in milliseconds.
				 */
				timeout?: number


				/**
				 * (optional) Specifies a set of callbacks.
				 */
				on?: {
					/**
					 * (optional) A function invoked when the function executed by the thread returns.
					 *
					 * @param t The value returned by the function.
					 */
					result?: (t: T) => void

					/**
					 * (optional) A function invoked if the function executed by the thread throws an exception.
					 *
					 * @param e The JavaScript value thrown.
					 */
					error?: (e: any) => void

					/**
					 * (optional) A function invoked if the function executed by the thread times out. This function must do any
					 * cleanup desired to terminate the executing function; the function will otherwise continue executing in
					 * the background.
					 */
					timeout?: () => void
				}
			}, factory?: (_r: slime.jrunscript.native.java.lang.Runnable) => slime.jrunscript.native.java.lang.Thread): Thread
		}
	}


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { subject } = test;
			let count = 0;

			fifty.tests.exports.Thread.start = function() {
				var count = 0;
				verify(count).is(0);
				var thread = subject.Thread.start(function() {
					count++;
				});
				thread.join();
				verify(count).is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Runs a function in a separate thread, but blocks the calling thread until the function completes or times out. If the
		 * function times out, an error will be thrown.
		 *
		 * @returns The value returned by the underlying function specified by `call`.
		 */
		run: <T>(
			p: {
				call: () => T

				/**
				 * (optional) A timeout, in milliseconds.
				 */
				timeout?: number
			}
		) => T
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { subject } = test;

			fifty.tests.exports.Thread.run = function() {
				var fn = function(result: number, sleep?: number) {
					return function() {
						if (sleep) Packages.java.lang.Thread.sleep(sleep);
						return result;
					}
				};

				var f_one = fn(1, 250);

				var one = subject.Thread.run({
					call: f_one,
					timeout: 500
				});
				verify(one).is(1);

				try {
					var tooLate = subject.Thread.run({
						call: f_one,
						timeout: 100
					});
					verify(false).is(true);
				} catch (e) {
					if (e instanceof Error) {
						verify(e).name.is("JavaThreadTimeoutError");
						verify(e).message.is("Timed out.");
					} else {
						verify("Error").is("Not Error");
					}
				}
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	/**
	 * Represents a Java monitor that can be used for synchronization.
	 */
	export interface Monitor {
		/**
		 * Creates a function that waits on its parent monitor until a condition is true, and then executes an underlying
		 * function.
		 *
		 * @param p An object specifying the condition and function.
		 *
		 * @returns A function that can be invoked that will invoke `until` repeatedly and wait on the monitor if it returns
		 * `false`; when `until` returns `true`, `then` will be invoked and the return value from `then` returned.
		 */
		Waiter: <T>(p: {
			/**
			 * (optional; default returns `true`) A function that specifies whether the condition has been satisfied. The
			 * function will receive the `this` and arguments passed to the function by the caller.
			 *
			 * @returns `true` indicating the condition has been satisfied; `false` indicating it has not.
			 */
			until?: (...args: any[]) => boolean

			/**
			 * (optional; default does nothing) A function to execute when the condition has been satisfied. The function will
			 * receive the `this` and arguments passed to the function by the caller, and can return any value intended to be
			 * returned to the caller.
			 */
			then?: (...args: any[]) => T
		}) => () => T
	}

	export interface Exports {
		Monitor: new () => Monitor
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = threads.test.subject;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			fifty.tests.exports.Thread.Monitor = function() {
				if (module.Thread) {
					var lock = new module.Thread.Monitor();

					var count = 0;

					var waiter = function() {
						return lock.Waiter({
							//	TODO	make optional in API with this default implementation
							until: function() {
								return true;
							},
							then: function() {
								test(count == 0);
								count++;
								test(count == 1);
								Packages.java.lang.Thread.sleep(Packages.java.lang.Math.random() * 100);
								count--;
								test(count == 0);
//											jsh.shell.echo("Success.");
							}
						});
					}

					var waiters = [];
					for (var i=0; i<10; i++) {
						waiters.push(waiter());
					}

					var joiners = [];
					waiters.forEach(function(element) {
						//	jsh.shell.echo("Starting ...");
						var t = module.Thread.start({
							call: element,
							on: {
								result: function(o) {
									//	jsh.shell.echo("Finished.");
									test(true);
								},
								error: function(t) {
									//	jsh.shell.echo("Threw.");
									throw t;
								}
							}
						});
						joiners.push(t);
					});

					joiners.forEach(function(t) {
						t.join();
					});
				}
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		Lock: () => {
			wait: <T>(p: {
				when?: () => boolean
				timeout?: () => number
				then?: () => T
			}) => () => T
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const subject = test.subject.Thread;

			fifty.tests.exports.Lock = function() {
				var lock = subject.Lock();

				var count = 0;

				var ordered: number[] = [];

				var threads = [0,1,2,3,4].map(function(index) {
					return lock.wait({
						when: function() {
							return count == 4 - index;
						},
						then: function() {
							ordered.push(index);
							count++;
						}
					});
				}).map(function(f) {
					return subject.start({
						call: f
					});
				});

				threads.forEach(function(thread) {
					thread.join();
				});

				verify(ordered)[0].is(4);
				verify(ordered)[1].is(3);
				verify(ordered)[2].is(2);
				verify(ordered)[3].is(1);
				verify(ordered)[4].is(0);
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		/**
		 * Creates a function whose execution synchronizes on the `this` object of its invocation.
		 *
		 * @param f A function which the returned function should execute.
		 *
		 * @returns A function that obtains the lock to its `this` object, executes the given function, and then releases the
		 * lock.
		 */
		thisSynchronize: <F extends (...args: any[]) => any>(f: F) => F
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = threads.test.subject;

			const test = function(b: boolean) {
				verify(b).is(true);
			};

			fifty.tests.exports.Thread.thisSynchronize = function() {
				if (module.Thread) {
					var f = function(x) {
						return 2*x;
					};

					var s = module.Thread.thisSynchronize(f);

					//	TODO	actually test synchronization

					test(s(2) == 4);
					test(s(4) == 8);

					var debug = function(s) {
//								Packages.java.lang.System.err.println(s);
					}

					var lock = new Packages.java.lang.Object();

					var finished = 0;

					var inner = Object.assign(function() {
						inner.count++;
						Packages.java.lang.Thread.sleep(100);
						inner.count--;
						finished++;
						this.notifyAll();
					}, { count: 0 });

					var nested = module.Thread.thisSynchronize(inner);

					var outer = Object.assign(function() {
						outer.count++;
						nested.call(lock);
						outer.count--;
					}, { count: 0 });

					var getCount = module.Thread.thisSynchronize(function() {
						return inner.count;
					});

					var threads = [];
					for (var i=0; i<10; i++) {
						threads.push(module.Thread.start({
							call: outer,
							on: new function() {
								this.returned = function(rv) {
									debug("outer = " + outer.count);
									test(getCount.call(lock) == 0);
								}

								this.threw = function(e) {
									debug("threw = " + e);
									throw e;
								}
							}
						}));
					}

					threads.forEach( function(thread) {
						thread.join();
					});

					test(finished == 10);
				}
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		Task: any
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;

			const module = threads.test.subject;

			fifty.tests.exports.Thread.Task = function() {
				run(function _1() {
					var monitor = new module.Thread.Monitor();
					var task = new module.Thread.Task({
						call: function() {
							return 2*2;
						}
					});
					var events = [];
					var finished: number;
					task(function(error,returned) {
						monitor.Waiter({
							until: function() {
								return true;
							},
							then: function() {
								events.push(function() {
									finished = returned;
								})
							}
						})();
					});
					while(!finished) {
						monitor.Waiter({
							until: function() {
								return Boolean(events.length);
							},
							then: function() {
								events.shift()();
							}
						})();
					}
					verify(finished).is(4);
				});

				if (fifty.global.jsh.shell.environment["SLIME_TEST_ISSUE_1683"]) run(function _2() {
					var scope = {
						$$api: void(0),
						monitor: void(0),
						A: void(0),
						B: void(0),
						C: void(0)
					};

					(
						function(scope) {
							var $$api = fifty.global.$api;
							// $jsapi.loader.eval("../../loader/$api.js", {
							// 	$slime: {
							// 		getRuntimeScript: function(path) {
							// 			return {
							// 				name: path,
							// 				js: $jsapi.loader.string("../../loader/" + path)
							// 			}
							// 		}
							// 	},
							// 	//	TODO	dubious; relies on $engine/$platform compatibility
							// 	$engine: $platform,
							// 	$export: function(value) {
							// 		$$api = value;
							// 	}
							// });
							scope.$$api = $$api;

							var monitor = new module.Thread.Monitor();

							scope.monitor = monitor;

							var Multithreaded = function(step) {
								var Event = function(f) {
									return function(error,returned) {
										monitor.Waiter({
											until: function() {
												return true;
											},
											then: function() {
												f();
											}
										})();
									}
								};

								return {
									toString: function() {
										return step.toString();
									},
									ready: function() {
										return step.ready();
									},
									task: new module.Thread.Task({
										call: Event(step.call)
									})
								};
							}

							scope.A = function(shared) {
								return Multithreaded({
									ready: function() {
										return true;
									},
									call: function() {
										shared.a = true;
									}
								});
							};
							scope.B = function(shared) {
								return Multithreaded({
									ready: function() {
										return shared.a;
									},
									call: function() {
										shared.b = true;
									}
								});
							};
							scope.C = function(shared) {
								return Multithreaded({
									toString: function() {
										return "C";
									},
									ready: function() {
										return false;
									},
									call: function() {
										throw new Error();
									}
								});
							};
						}
					)(scope);

					const { monitor, $$api, C, A, B } = scope;

					Packages.java.lang.System.err.println("Second test.");
					var Steps: () => {
						shared: {
							a: boolean
							b: boolean
						}
						c: any
						steps: any[]
						unready: any[]
						on: {
							unready: (e: any) => void
						}
					} = function() {
						var shared = { a: false, b: false };
						var unready = [];

						var c = new C(shared)

						return {
							shared: shared,
							c: c,
							steps: [new A(shared), new B(shared), c],
							unready: unready,
							on: {
								unready: function(e) {
									unready.push(e.detail);
								}
							}
						}
					};

					var steps = Steps();

					//	TODO	this code tests $api.threads and so should be moved
					var task = $$api.threads.steps.Task(steps);

					var finished = false;

					task(monitor.Waiter({
						until: function() {
							return true;
						},
						then: function() {
							finished = true;
						}
					}));

					monitor.Waiter({
						until: function() {
							return finished;
						},
						then: function() {
						}
					})();

					verify(steps).shared.a.is(true);
					verify(steps).shared.b.is(true);
					verify(steps).unready.length.is(1);
					//	TODO	verify(unready[0]).ready.is(steps.c.ready) does not work because ready property of the
					//			verify object does not have is() method. Probably addressable in unit test framework.
					const asObject = function(p: any) { return p as object; }
					verify(steps).unready[0].evaluate(asObject).is(steps.c);

					var ssteps = Steps();
					verify(ssteps).shared.a.is(false);

					var stask = $$api.threads.steps.Task(ssteps);

					stask();

					verify(ssteps).shared.a.is(true);
					verify(ssteps).shared.b.is(true);
					verify(ssteps).unready.length.is(1);
					if (ssteps.unready.length) {
						verify(ssteps).unready[0].evaluate(asObject).is(ssteps.c);
					}
				})
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		map: <T,O extends Object,R>(
			array: T[],
			mapper: (this: O, item: T) => R,
			target?: O,
			p?: {
				callback: (p: {
					completed: number
					running: number
					index: number
					threw?: any
					returned?: any
				}) => void

				limit: number
			}
		) => R[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const module = threads.test.subject;

			fifty.tests.exports.Thread.map = function() {
				var array = [1,2,3];
				var doubled = module.Thread.map(
					array,
					function(element) {
						return element * 2;
					},
					null,
					{
						limit: 2,
						callback: function(result) {
							if (result.threw) {
								jsh.shell.console(result.index + "/" + result.threw.type + ": " + result.threw.message);
								jsh.shell.console(result.threw.stack);
							} else {
								jsh.shell.console(result.index + "/" + result.returned);
							}
						}
					}
				);
				verify(doubled)[0].is(2);
				verify(doubled)[1].is(4);
				verify(doubled)[2].is(6);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		forkJoin: <T>(f: (() => T)[]) => T[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = threads.test.subject;

			fifty.tests.exports.Thread.forkJoin = function() {
				var fork = [
					(function() { return 1; }),
					(function() { return 3; }),
					(function() { return 2; })
				];
				var result = module.Thread.forkJoin(fork);
				verify(result).length.is(3);
				verify(result)[0].is(1);
				verify(result)[1].is(3);
				verify(result)[2].is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = threads.test.subject;

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			fifty.tests.exports.Thread.jsapi = function() {
				if (module.Thread) {
					var sleeper = function(length) {
						return function() {
							Packages.java.lang.Thread.sleep(length);
						}
					}

					var f = function() {
						Packages.java.lang.Thread.sleep(100);
						return 1;
					};

					var Callbacks = function() {
						var result;

						return {
							result: function(v) {
								result = v;
							},
							error: function(t) {
								throw t;
							},
							timeout: function() {
								result = "Timed out.";
							},
							evaluate: function() {
								return result;
							},
							getResult: function() {
								return result;
							}
						};
					};

					var c1 = Callbacks();
					var t1 = module.Thread.start({
						call: f,
						timeout: 150,
						on: c1
					});
					t1.join();
					test(c1.evaluate() == 1);

					//	This test is highly suspect; it essentially hopes that the CPU scheduling happens as expected. Its
					//	chances of passage could be improved by using thread priorities for timeouts, which is probably a good
					//	idea anyway. But perhaps it needs to be re-designed.
					var c2 = Callbacks();
					var t2 = module.Thread.start({
						call: sleeper(250),
						timeout: 50,
						on: c2
					});
					t2.join();
					//@ts-ignore
					verify(c2).getResult().is("Timed out.");
				}
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		setContextClassLoader: any

		/**
		 * Causes the currently running thread to sleep for the given number of milliseconds.
		 */
		sleep: (milliseconds: number) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
