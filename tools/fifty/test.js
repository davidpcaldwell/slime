//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.runtime.Platform } $platform
	 * @param { slime.$api.Global } $api
	 * @param { slime.fifty.internal.test.Context } $context
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.loader.Export<slime.fifty.internal.test.Exports> } $export
	 */
	function($platform,$api,$context,$loader,$export) {
		//	This file has four callers:
		//	*	fifty / jsh: test.jsh.js
		//	*	fifty / browser: test-browser.js
		//	*	jsapi / jsh: loader/api/old/jsh/html.js
		//	*	jsapi / browser: loader/browser/test/api.js

		/**
		 *
		 * @param { boolean } success
		 * @returns { slime.fifty.internal.test.Result }
		 */
		var toResult = function(success) {
			return ($context.promises) ? $context.promises.Promise.resolve(success) : {
				then: function(f) {
					return f(success);
				}
			}
		};

		/**
		 * @type { slime.fifty.internal.test.Executors }
		 */
		function TestExecutors(parent,console) {
			//	TODO	is console used at all if parent is present?

			/**
			 *
			 * @param { { parent?: slime.fifty.internal.test.Scope, listener?: slime.fifty.internal.test.Listener } } p
			 * @returns { slime.fifty.internal.test.Scope }
			 */
			function Scope(p) {
				return new function() {
					/** @type { slime.$api.event.Emitter<slime.fifty.internal.test.Events> } */
					var emitter = $api.events.emitter({
						source: this,
						on: p.listener,
						parent: (p.parent) ? p.parent.emitter : void(0)
					});

					this.toString = function() {
						return "Scope: " + this.depth();
					}

					this.depth = function() {
						return (p.parent) ? p.parent.depth() + 1 : 0;
					};

					this.success = true;

					this.emitter = emitter;

					var started;

					this.start = function(name) {
						started = new Date().getTime();
						emitter.fire("start", { name: name });
					};

					this.end = function(name,result) {
						emitter.fire("end", { name: name, result: result, elapsed: new Date().getTime() - started });
					};

					var self = this;

					emitter.listeners.add("test", function(e) {
						var result = e.detail;
						if (result.success === false) {
							//	TODO	is this needed, or is the `this` argument already `self`?
							self.success = false;
						} else if (result.success === true) {
							//	do nothing
						} else if (result.success === null) {
							self.success = false;
						} else {
							throw new TypeError();
						}
					});

					/** @type { slime.definition.verify.Executor } */
					this.test = function(f) {
						/** @type { slime.definition.unit.Test.Result } */
						var result;
						try {
							result = f();
						} catch (e) {
							result = {
								success: null,
								message: String(e) + ((e.stack) ? ("\n" + e.stack) : ""),
								error: e
							}
						}
						emitter.fire("test", { message: result.message, success: result.success, error: result.error });
					};
				}
			}

			/**
			 * @type { (console: slime.$api.event.Handlers<slime.fifty.internal.test.Events>) => slime.fifty.internal.test.State }
			 */
			var State = function(console) {
				var initial = Scope({ listener: console });

				var current = function(/** @type { slime.fifty.internal.test.Scope } */scope) {
					return /** @type { slime.fifty.internal.test.Current } */({
						scope: scope,
						verify: $context.library.Verify(
							function(f) {
								scope.test(f);
							}
						)
					});
				}

				/** @type { slime.fifty.internal.test.Current } */
				var now = current(initial);

				return /** @type { slime.fifty.internal.test.State } */({
					start: function(name) {
						now.scope.start(name);
						var was = now;
						now = current(Scope({ parent: (was) ? was.scope : void(0)/*, listener: console */ }));
						//	Caller is currently responsible for keeping track of the stack, but we can at least help by providing
						//	the previous state
						return {
							previous: was,
							current: now
						};
					},
					end: function(name,was) {
						var result = now.scope.success;
						now = was;
						now.scope.end(name,result);
						return result;
					},
					verify: function() {
						return now.verify.apply(this,arguments);
					},
					error: function(e) {
						now.scope.test(function() {
							throw e;
						});
					},
				});
			};

			var state = (parent) ? parent : State(console);

			/**
			 *
			 * @param { slime.fifty.internal.test.AsynchronousScope } ascope
			 * @param { string } name
			 * @param { () => void } execute
			 * @returns { slime.fifty.internal.test.Result }
			 */
			var executeTestScope = function(ascope,name,execute) {
				if (ascope) ascope.test.log("async tests: starting scope", name, ascope.test.depth());
				if (ascope) ascope.start();
				if (ascope) ascope.test.setName(name);

				var states = state.start(name);
				var was = states.previous;

				function after() {
					return state.end(name, was);
				}

				if (ascope) {
					var executor = function synchronous(resolve,reject) {
						execute();
						ascope.test.log("Resolving executeTestScope<" + name + ">");
						resolve(void(0));
					};
					executor.toString = function() {
						return "executeTestScope <" + name + ">";
					}

					ascope.test.log("async tests: creating promise for scope", name);
					var rv = new $context.promises.Promise(executor)
						.then(function(executed) {
							ascope.test.log("async tests: waiting for scope synchronous execution", name);
							return ascope.wait();
						})
					;

					ascope.subscopes().forEach(function(subscope) {
						rv = rv.then(function(ignore) {
							return new $context.promises.NativePromise(
								function(resolve,reject) {
									subscope().then(function forwardTestResult(success) {
										resolve(success);
									})
								}
							);
						});
					});

					// rv = $context.promises.NativePromise.prototype.then.call(
					// 	rv,
					// 	function done(done) {
					// 		$context.promises.console.log("async tests: computing after() for", name);
					// 		return Promise.resolve(after());
					// 	}
					// )
					rv = rv
						.then(function done(done) {
							$context.promises.console.log("async tests: computing after() for", name);
							ascope.test.log("async tests: restoring scope and verify to", name, (was) ? was.scope : void(0), (was) ? was.verify : void(0));
							return Promise.resolve(after());
						})
					;

					ascope.external(rv);

					return rv;
				} else {
					execute();
					return toResult(after());
				}
			}

			/**
			 *
			 * @param { slime.fifty.test.tests } tests
			 * @returns
			 */
			var runner = function(tests) {
				/**
				 *
				 * @param { slime.fifty.test.tests } tests - the tests for this file
				 * @param { any } code - the code to run
				 * @returns
				 */
				var getContainerName = function(tests,code) {
					function getPropertyPathFrom(target) {
						return function(value) {
							if (value === target) return [];
							for (var x in target) {
								var found = getPropertyPathFrom(target[x])(value);
								if (found) return [x].concat(found);
							}
							return null;
						}
					}

					if (!code) throw new TypeError("Cannot run scope " + code);
					/** @type { string } */
					var name;
					if (!name) name = $api.fp.result(
						code,
						getPropertyPathFrom(tests),
						function(array) {
							return (array) ? array.join(".") : array;
						}
					);
					if (!name) name = code.name;
					if (!name) name = "run";
					return name;
				};

				/**
				 * @template { any } T
				 * @param { slime.fifty.internal.test.AsynchronousScope } ascope
				 * @param { (t: T) => void } callable
				 * @param { string } name essentially for display when reporting results
				 * @param { T } [argument]
				 * @returns { slime.fifty.internal.test.Result }
				 */
				var rv = function(ascope,callable,name,argument) {
					return executeTestScope(
						ascope,
						(name) ? name : getContainerName(tests,callable),
						function() {
							try {
								callable(argument);
							} catch (e) {
								state.error(e);
							}
						}
					)
				};

				return rv;
			};

			/**
			 *
			 * @param { string } name
			 * @param { Error & { printStackTrace?: () => void, javaException?: any }} e
			 */
			var error = function(name,e) {
				executeTestScope(
					void(0),
					name,
					function() {
						var error = [
							String(e),
							e.stack
						];
						if (e["printStackTrace"]) {
							e.printStackTrace();
						}
						if (e.javaException) {
							error.push("Java exception:");
							var ex = e.javaException;
							if (String(ex) == "inonit.script.rhino.Errors") {
								var Packages = (function() { return this; })().Packages;
								var JavaAdapter = (function() { return this; })().JavaAdapter;
								var _log = new JavaAdapter(
									Packages.inonit.script.rhino.Engine.Log,
									{
										println: function(s) {
											error.push(String(s));
										}
									}
								)
								ex.dump(_log, "[fifty] ");
							} else {
								while(ex != null) {
									error.push(ex.getClass().getName() + ": " + ex.getMessage());
									var _stack = ex.getStackTrace();
									for (var i=0; i<_stack.length; i++) {
										error.push("\t" + String(_stack[i].toString()));
									}
									ex = ex.getCause();
									if (ex) error.push("");
								}
							}
						}
						state.verify(error.join("\n")).is("Successfully loaded tests");
					}
				)
			};

			return {
				runner: runner,
				error: error,
				verify: function() {
					return state.verify.apply(this,arguments);
				},
				state: function() {
					return state;
				}
			}
		}

		/** @typedef { ReturnType<TestExecutors> } Executors */

		var parsePath = function(path) {
			var tokens = path.split("/");
			return {
				folder: (tokens.length > 1) ? tokens.slice(0, tokens.length-1).join("/") + "/" : "",
				file: tokens[tokens.length-1]
			}
		};

		var scopes = (
			function() {
				var rv = {};
				if ($context.jsh) {
					rv.jsh = $context.jsh.scope;
				}
				return rv;
			}
		)();

		/** @type { slime.fifty.test.Kit["global"] } */
		var global = $api.fp.now(
			{},
			$api.Object.defineProperty({
				name: "$platform",
				descriptor: {
					value: $platform
				}
			}),
			$api.Object.defineProperty({
				name: "$api",
				descriptor: {
					value: $api
				}
			}),
			$api.Object.maybeDefineProperty({
				name: "jsh",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					return ($context.jsh) ? { value: $context.jsh.global } : void(0)
				})
			}),
			$api.Object.maybeDefineProperty({
				name: "window",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					return ($context.window) ? { value: $context.window.global } : void(0)
				})
			}),
			$api.Object.maybeDefineProperty({
				name: "customElements",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					if ($context.window) {
						var registry = (
							function() {
								var next = 0;
								var prefix = "fifty-customelements-";
								return {
									register: function(factory) {
										$context.window.global.customElements.define(prefix + String(next++), factory);
									}
								}
							}
						)();
						return {
							value: registry
						}
					}
				})
			})
		);

		/**
		 * @type { slime.fifty.internal.test.Load }
		 */
		var load = function recurse(context,state,argument) {
			var ascopes = state.asynchronous;
			//	TODO	it appears context.file.loader and context.scopes.jsh.loader may be redundant?

			/**
			 *
			 * @returns { { threw: any, fifty: slime.fifty.test.Kit } & Pick<ReturnType<slime.fifty.internal.test.Executors>, "runner" | "error"> }
			 */
			var testFileEvaluator = function(
				/** @type { slime.$api.event.Handlers<slime.fifty.internal.test.Events> } */console
			) {
				var executors = (console) ? TestExecutors(state.synchronous,console) : void(0);
				var tests = {
					//	TODO	this should probably be completely empty
					types: {}
				};

				/**
				 * @type { slime.fifty.test.Kit }
				 */
				var fifty = {
					global: global,
					$loader: context.file.loader,
					promises: $context.promises,
					$api: {
						Events: {
							Captor: function(template) {
								var events = [];
								/** @type { ReturnType<slime.fifty.test.Kit["$api"]["Events"]["Captor"]>["handler"] } */
								var initial = {};
								var handler = Object.entries(template).reduce(function(rv,entry) {
									rv[entry[0]] = function(e) {
										events.push(e);
									}
									return rv;
								}, initial);
								return {
									events: events,
									handler: handler
								}
							}
						}
					},
					run: function(f, name) {
						if ($context.promises) $context.promises.console.log("run", f, name);

						var controlled = (ascopes) ? $context.promises.controlled({ id: "run:" + (name || f["name"] ) }) : void(0);

						var run = function() {
							if ($context.promises) $context.promises.console.log("processing next child", name);
							var rv = executors.runner(tests, console)( (ascopes) ? ascopes.push() : void(0), f, name);
							if (controlled) controlled.resolve(void(0));
							if (ascopes) ascopes.pop();
							return rv;
						};

						if (ascopes) {
							if ($context.promises) $context.promises.console.log("ascope", ascopes.current().test.depth(), ascopes.current());
							ascopes.current().then(run);
							if ($context.promises) $context.promises.console.log("ascope now", ascopes.current().test.depth(), ascopes.current());
						} else {
							run();
						}
					},
					load: function(at,part,argument) {
						var controlled = ($context.promises) ? $context.promises.controlled() : void(0);

						var run = function() {

							var file = (
								function() {
									var path = parsePath(at);
									var subloader = (path.folder) ? context.file.loader.Child(path.folder) : context.file.loader;
									return {
										folder: path.folder,
										loader: subloader,
										path: path.file
									}
								}
							)();

							if (ascopes) ascopes.push();

							var rv = recurse(
								{
									file: file,
									environment: {
										jsh: (scopes.jsh)
											? {
												loader: (file.folder) ? context.environment.jsh.loader.Child(file.folder) : context.environment.jsh.loader,
												directory: (file.folder) ? context.environment.jsh.directory.getSubdirectory(file.folder) : context.environment.jsh.directory
											}
											: void(0)
									}
								},
								{ synchronous: executors.state(), asynchronous: ascopes },
								argument
							).part(part).run(console);

							if (controlled) controlled.resolve(void(0));
							if (ascopes) ascopes.pop();

							return rv;
						};

						if (ascopes) {
							ascopes.current().then(run);
						} else {
							run();
						}
					},
					test: {
						//	TODO	Should this do filtering?
						Parent: function() {
							var runChildren = function(target) {
								if (typeof(target) == "object") {
									for (var x in target) {
										runChildren(target[x]);
									}
								} else if (typeof(target) == "function") {
									fifty.run(target);
								}
							}
							var rv = function() {
								var callee = rv;
								for (var x in callee) {
									runChildren(callee[x])
								}
							};
							return rv;
						},
						multiplatform: void(0),
						platforms: void(0)
					},
					evaluate: {
						create: function(f,string) {
							return Object.assign(
								f,
								{
									toString: function() {
										return string;
									}
								}
							)
						}
					},
					spy: {
						/**
						 * @template { any } T
						 * @template { any[] } P
						 * @template { any } R
						 * @template { slime.external.lib.es5.Function<T,P,R> } F
						 * @param { F } f
						 * @returns { { function: F, invocations: slime.fifty.test.spy.Invocation<F>[] } }
						 */
						//	sometimes when this is embedded in another project, an error results here, so we ignore it
						//@ts-ignore
						create: function(f) {
							/** @type { slime.fifty.test.spy.Invocation<F>[] } */
							var recorded = [];
							return {
								function: /** @type { F } */(function() {
									/** @tyoe { T } */
									var target = this;
									var args = Array.prototype.slice.call(arguments);
									var rv = f.apply(this, arguments);
									var invocation = /** @type { slime.fifty.test.spy.Invocation<F> }*/({ target: target, arguments: args, returned: rv });
									recorded.push(invocation);
									return rv;
								}),
								invocations: recorded
							};
						}
					},
					tests: tests,
					verify: function() {
						return executors.verify.apply(this,arguments);
					},
					jsh: void(0)
				};

				if (scopes.jsh) {
					var jshScope = scopes.jsh({
						loader: context.environment.jsh.loader,
						directory: context.environment.jsh.directory,
						filename: context.file.path,
						fifty: fifty
					});

					fifty.test.multiplatform = jshScope.multiplatform;

					fifty.jsh = jshScope;
				} else {
					fifty.test.multiplatform = function(p) {
						var rv = function() {
							if (p.browser) p.browser();
						};
						rv.browser = p.browser;
						fifty.tests[p.name] = rv;
					};
				}

				fifty.test.platforms = function() {
					fifty.test.multiplatform({
						name: "platforms",
						jsh: function() {
							fifty.run(fifty.tests.suite);
						},
						browser: function() {
							//fifty.tests.suite();
							fifty.run(fifty.tests.suite);
						}
					});
				}

				var threw;

				try {
					context.file.loader.run(
						context.file.path,
						{
							fifty: fifty,
							//	We also provide $fifty for namespaces containing the name "fifty"
							$fifty: fifty
						}
					);
				} catch (e) {
					threw = e;
				}

				return {
					threw: threw,
					runner: executors.runner,
					error: executors.error,
					fifty: fifty
				}
			};

			/**
			 *
			 * @param { string } part
			 * @param { slime.fifty.internal.test.Listener } console
			 * @returns { slime.fifty.internal.test.Result }
			 */
			var run = function(part, console) {
				var testFileEvaluation = testFileEvaluator(console);

				var threw = testFileEvaluation.threw;
				var fifty = testFileEvaluation.fifty;

				if (!part) part = "suite";

				var getName = function(path,part) {
					if (context.environment.jsh) {
						return context.environment.jsh.directory.getRelativePath(path) + ":" + part;
					}
					return path + ":" + part;
				};

				if (!threw) {
					/** @type { any } */
					var target = fifty.tests;
					part.split(".").forEach(function(token) {
						target = $api.fp.now(target, $api.fp.optionalChain(token))
					});
					if (typeof(target) == "function") {
						/** @type { (argument: any) => void } */
						var callable = target;
						var createRunner = function() {
							return testFileEvaluation.runner(fifty.tests, console)( (ascopes) ? ascopes.current() : void(0), callable, getName(context.file.path,part), argument);
						}
						if ($context.promises) {
							return createRunner();
						} else {
							return createRunner();
						}
					} else {
						throw new TypeError("Not a function: " + part);
					}
				} else {
					testFileEvaluation.error(context.file.path, threw, console);
					//	TODO	no test coverage
					return toResult(false);
				}
			};

			return /** @type { ReturnType<slime.fifty.internal.test.Load> } */({
				part: function(part) {
					return {
						run: function(listener) {
							return run(part, listener);
						}
					}
				},
				list: function() {
					var testFileEvaluation = testFileEvaluator(void(0));

					function update(target, rv) {
						for (var x in target) {
							rv[x] = {
								test: typeof(target[x]) == "function",
								children: {}
							};
							update(target[x], rv[x].children);
						}
					}

					var rv = {
						test: false,
						children: {}
					};

					update(
						testFileEvaluation.fifty.tests,
						rv.children
					);

					return rv;
				}
			});
		};

		/**
		 *
		 * @param { { parent: slime.fifty.internal.test.AsynchronousScope, name: string } } [p]
		 * @returns { slime.fifty.internal.test.AsynchronousScope }
		 */
		var AsynchronousScope = function recurse(p) {
			var name = (p && p.name);
			$context.promises.console.log("creating scope", name);
			var nextChild = 0;

			/** @type { slime.definition.test.promises.Registry } */
			var registry;

			/** @type { slime.fifty.internal.test.AsynchronousSubscope[] } */
			var subscopes = [];

			return {
				test: {
					depth: function() {
						//	TODO	Probable bug / unused
						return scopes["length"];
					},
					setName: function(value) {
						registry.test.setName(value);
					},
					log: $context.promises.console.log
				},
				start: function() {
					//	It appears need to launch a null promise here to trigger the flow in case there are no other asynhronous
					//	promises involved
					var executor = function nullPromise(resolve,reject) {
						resolve(void(0));
					};
					executor.toString = function() {
						return "Null promise for AsynchronousScope <" + name + ">";
					}
					var nullPromise = new Promise(executor);

					$context.promises.console.log("creating registry", name);
					registry = $context.promises.Registry({ name: name });
					if (name) registry.test.setName(p.name);
					$context.promises.console.log("created registry", name);
				},
				then: function(v) {
					subscopes.push(v);
				},
				subscopes: function() {
					return subscopes;
				},
				wait: function() {
					return registry.wait();
				},
				child: function() {
					return recurse({ parent: this, name: name + "/" + String(nextChild++) });
				},
				external: function(promise) {
					registry.external(promise);
				}
			}
		};

		//	We use a single `fifty` object throughout, and we can't change it across stack frames, so we cannot implement
		//	these scopes on the stack; rather, we must implement a stack of them.
		/**
		 *
		 * @returns { slime.fifty.internal.test.AsynchronousScopes }
		 */
		var AsynchronousScopes = function() {
			var initial = AsynchronousScope({ parent: null, name: "(top)" });

			var stack = [ initial ];

			var current = function() {
				return stack[stack.length-1];
			}

			return {
				push: function() {
					var push = current().child();
					stack.push(push);
					return push;
				},
				pop: function() {
					stack.pop();
				},
				current: function() {
					return current();
				}
			}
		};

		$export({
			run: function(p/*loader,scopes,path,part*/) {
				var ascopes = ($context.promises) ? AsynchronousScopes() : void(0);
				return load(p, { synchronous: void(0), asynchronous: ascopes }).part(p.part).run(p.console);
			},
			list: function(p/*loader,scopes,path*/) {
				var ascopes = ($context.promises) ? AsynchronousScopes() : void(0);
				return load(p, { synchronous: void(0), asynchronous: ascopes }).list();
			}
		})
	}
//@ts-ignore
)($platform,$api,$context,$loader,$export);
