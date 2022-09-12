//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.fifty.test.internal.test.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.fifty.test.internal.test.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		//	This file has four callers:
		//	*	fifty / jsh: test.jsh.js
		//	*	fifty / browser: test-browser.js
		//	*	jsapi / jsh: jsh/unit/html.js
		//	*	jsapi / browser: loader/browser/test/api.js

		var console = $context.console;

		/**
		 *
		 * @param { { parent?: slime.fifty.test.internal.Scope } } [p]
		 * @returns { slime.fifty.test.internal.Scope }
		 */
		function Scope(p) {
			if (!p) p = {};

			return new function() {
				this.success = true;

				this.depth = function() {
					return (p.parent) ? p.parent.depth() + 1 : 0;
				};

				this.fail = function() {
					this.success = false;
					if (p.parent) p.parent.fail();
				}

				this.toString = function() {
					return "Scope: " + this.depth();
				}

				this.start = function(name) {
					console.start(this, name);
				}

				this.end = function(name,result) {
					console.end(this, name, result);
				}

				/** @type { slime.definition.verify.Context } */
				this.test = function(f) {
					/** @type { slime.definition.unit.Test.Result } */
					var result;
					try {
						result = f();
						if (result.success === false) {
							this.fail();
						} else if (result.success === true) {
							//	do nothing
						} else {
							throw new TypeError();
						}
					} catch (e) {
						this.fail();
						result = {
							success: null,
							message: String(e) + ((e.stack) ? ("\n" + e.stack) : ""),
							error: e
						}
					}
					console.test(this, result.message, result.success);
				}
			}
		}

		/** @type { slime.fifty.test.internal.Scope } */
		var scope;
		/** @type { slime.definition.verify.Verify } */
		var verify;

		/**
		 *
		 * @param { slime.fifty.test.internal.Scope } newScope
		 * @param { slime.definition.verify.Verify } newVerify
		 */
		var setContext = function(newScope,newVerify) {
			scope = newScope;
			verify = newVerify;
		}

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
			if (!name) name = $api.Function.result(
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

		var start = function(name) {
			if (scope) {
				scope.start(name);
			} else {
				console.start(null, name);
			}
		};

		/**
		 *
		 * @param { boolean } success
		 * @returns { slime.fifty.test.internal.test.Result }
		 */
		var toResult = function(success) {
			return ($context.promises) ? $context.promises.Promise.resolve(success) : {
				then: function(f) {
					return f(success);
				}
			}
		}

		/**
		 *
		 * @param { { name: string } } [p]
		 * @returns
		 */
		var AsynchronousScope = function recurse(p) {
			var name = (p && p.name);
			$context.promises.console.log("creating scope", name);
			var nextChild = 0;

			var registry;
			var promises;

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
					var executor = function promises(resolve,reject) {
						resolve(void(0));
					};
					executor.toString = function() {
						return "Null promise for AsynchronousScope <" + name + ">";
					}
					promises = new Promise(executor);

					$context.promises.console.log("creating registry", name);
					registry = $context.promises.Registry({ name: name });
					if (name) registry.test.setName(p.name);
					$context.promises.console.log("created registry", name);
				},
				then: function(v) {
					promises = promises.then(v);
					return promises;
				},
				now: function() {
					return promises;
				},
				wait: function() {
					return registry.wait();
				},
				child: function() {
					return recurse({ name: name + "/" + String(nextChild++) });
				}
			}
		};

		//	We use a single `fifty` object throughout, and we can't change it across stack frames, so we cannot implement
		//	these scopes on the stack; rather, we must implement a stack of them.
		var AsynchronousScopes = function(initial) {
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

		/**
		 *
		 * @param { slime.fifty.test.internal.test.AsynchronousScope } ascope
		 * @param { string } name
		 * @param { () => void } execute
		 * @returns { slime.fifty.test.internal.test.Result }
		 */
		var executeTestScope = function(ascope,name,execute) {
			if (ascope) ascope.test.log("async tests: starting scope", name, ascope.test.depth());
			if (ascope) ascope.start();
			if (ascope) ascope.test.setName(name);

			start(name);
			var was = {
				scope: scope,
				verify: verify
			};
			var localscope = Scope({ parent: scope });
			var localverify = $context.library.Verify(
				function(f) {
					scope.test(f);
				}
			);
			setContext(localscope, localverify);

			function after() {
				var result = localscope.success;
				if (ascope) ascope.test.log("async tests: restoring scope and verify to", name, was.scope, was.verify);
				setContext(was.scope, was.verify);
				if (scope) {
					scope.end(name,result);
				} else {
					console.end(null, name, result);
				}
				return result;
			}

			if (ascope) {
				var executor = function(resolve,reject) {
					execute();
					resolve(void(0));
				};
				executor.toString = function() {
					return "executeTestScope <" + name + ">";
				}

				return new $context.promises.Promise(executor).then(function(executed) {
					ascope.test.log("async tests: waiting for scope", name);
					return ascope.wait();
				}).then(function(done) {
					$context.promises.console.log("async tests: computing after() for", name);
					return Promise.resolve(after());
				});
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
			 * @template { any } T
			 * @param { (t: T) => void } callable
			 * @param { string } name essentially for display when reporting results
			 * @param { T } [argument]
			 * @returns { slime.fifty.test.internal.test.Result }
			 */
			var rv = function(ascope,callable,name,argument) {
				return executeTestScope(
					ascope,
					(name) ? name : getContainerName(tests,callable),
					function() {
						try {
							callable(argument);
						} catch (e) {
							scope.test(function() {
								throw e;
							});
						}
					}
				)
			}
			return rv;
		};

		var error = function(name,e) {
			executeTestScope(
				void(0),
				name,
				function() { verify(String(e) + "\n" + e.stack).is("Successfully loaded tests"); }
			)
		}

		var parsePath = function(path) {
			var tokens = path.split("/");
			return {
				folder: (tokens.length > 1) ? tokens.slice(0, tokens.length-1).join("/") + "/" : "",
				file: tokens[tokens.length-1]
			}
		};

		var global = (function() { return this; })();

		var scopes = (
			function() {
				var rv = {};
				/** @type { slime.fifty.test.internal.scope.jsh.Script } */
				var script = $loader.script("scope-jsh.ts");
				if (global.jsh) {
					var scope = script();
					rv.jsh = scope;
				}
				return rv;
			}
		)();

		/**
		 *
		 * @param { slime.fifty.test.internal.test.AsynchronousScopes } ascopes
		 * @param { slime.old.Loader } loader
		 * @param { Parameters<slime.fifty.test.internal.test.Exports["run"]>[1] } contexts
		 * @param { string } path
		 * @param { any } [argument]
		 * @returns { { run: (part: string) => slime.fifty.test.internal.test.Result, list: () => slime.fifty.test.internal.test.Manifest } }
		 */
		var load = function recurse(ascopes,loader,contexts,path,argument) {
			//	TODO	it appears loader and contexts.jsh.loader may be redundant?

			//	TODO	this should probably be completely empty
			var tests = {
				types: {}
			};

			/**
			 * @type { slime.fifty.test.Kit }
			 */
			var fifty = {
				global: {
					$api: $api,
					jsh: global.jsh,
					window: global.window
				},
				$loader: loader,
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
						var rv = runner(tests)( (ascopes) ? ascopes.push() : void(0), f, name);
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
						var path = parsePath(at);
						var subloader = (path.folder) ? loader.Child(path.folder) : loader;
						if (ascopes) ascopes.push();
						var rv = recurse(
							ascopes,
							subloader,
							{
								jsh: (scopes.jsh)
									? {
										loader: (path.folder) ? contexts.jsh.loader.Child(path.folder) : contexts.jsh.loader,
										directory: (path.folder) ? contexts.jsh.directory.getSubdirectory(path.folder) : contexts.jsh.directory
									}
									: void(0)
							},
							path.file,
							argument
						).run(part);
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
					}
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
				tests: tests,
				verify: function() {
					return verify.apply(this,arguments);
				},
				jsh: (scopes.jsh) ? scopes.jsh({
					loader: contexts.jsh.loader,
					directory: contexts.jsh.directory,
					filename: path
				}) : void(0)
			};

			var scope = {
				fifty: fifty,
				//	We also provide $fifty for namespaces containing the name "fifty"
				$fifty: fifty
			}

			//	TODO	deprecate
			Object.assign(scope, {
				global: fifty.global,
				$loader: fifty.$loader,
				run: fifty.run,
				load: fifty.load,
				tests: fifty.tests,
				verify: fifty.verify
			});

			//	TODO	deprecate
			Object.assign(scope, {
				jsh: global.jsh
			});

			var loaderError;

			try {
				loader.run(
					path,
					scope
				);
			} catch (e) {
				loaderError = e;
			}

			return {
				/**
				 *
				 * @param { string } part - the part to execute. If `undefined`, the default value `"suite"` will be used.
				 * @returns
				 */
				run: function(part) {
					if (!part) part = "suite";

					if (!loaderError) {
						/** @type { any } */
						var target = scope.tests;
						part.split(".").forEach(function(token) {
							target = $api.Function.result(target, $api.Function.optionalChain(token))
						});
						if (typeof(target) == "function") {
							/** @type { (argument: any) => void } */
							var callable = target;
							var createRunner = function() {
								return runner(tests)( (ascopes) ? ascopes.current() : void(0), callable, path + ":" + part, argument);
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
						error(path, loaderError);
						//	TODO	no test coverage
						return toResult(false);
					}
				},
				list: function() {
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
						scope.tests,
						rv.children
					);

					return rv;
				}
			}
		}

		$export({
			run: function(loader,scopes,path,part) {
				var ascopes = ($context.promises) ? AsynchronousScopes(
					AsynchronousScope({ name: "(top)" })
				) : void(0);
				return load(ascopes,loader,scopes,path).run(part);
			},
			list: function(loader,scopes,path) {
				var ascopes = ($context.promises) ? AsynchronousScopes(
					AsynchronousScope({ name: "(top)" })
				) : void(0);
				return load(ascopes,loader,scopes,path).list();
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
