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
	 * @param { slime.loader.Export<slime.fifty.test.internal.test.Export> } $export
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

			var registry;
			var promises;

			return {
				test: {
					depth: function() {
						return scopes.length;
					},
					setName: function(value) {
						registry.test.setName(value);
					},
					log: $context.promises.console.log
				},
				start: function() {
					promises = new Promise(function promises(resolve,reject) {
						resolve(void(0));
					});

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
					return recurse();
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
			if (ascope) ascope.start();
			if (ascope) ascope.test.log("executeTestScope", name, ascope.test.depth());
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
			scope = localscope;
			verify = localverify;

			function after() {
				var result = localscope.success;
				if (ascope) ascope.test.log("restoring scope and verify to", was.scope, was.verify);
				scope = was.scope;
				verify = was.verify;
				if (scope) {
					scope.end(name,result);
				} else {
					console.end(null, name, result);
				}
				return result;
			}

			if (ascope) {
				return new $context.promises.Promise(function(resolve,reject) {
					execute();
					resolve(void(0));
				}).then(function(executed) {
					return ascope.wait();
				}).then(function(done) {
					$context.promises.console.log("computing after() for", name);
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

		var scopes = (function() {
			var rv = {};
			if (global.jsh) rv.jsh = $loader.file("scope-jsh.ts");
			return rv;
		})();

		/**
		 *
		 * @param { slime.fifty.test.internal.test.AsynchronousScopes } ascopes
		 * @param { slime.fifty.test.$loader } loader
		 * @param { string } path
		 * @param { string } part - the part to execute. If `undefined`, the default value `"suite"` will be used.
		 * @param { any } [argument]
		 * @returns { slime.fifty.test.internal.test.Result }
		 */
		var load = function recurse(ascopes,loader,path,part,argument) {
			if (!part) part = "suite";

			//	TODO	this should probably be completely empty
			var tests = {
				types: {}
			};

			/**
			 * @type { slime.fifty.test.kit }
			 */
			var fifty = {
				global: global,
				$loader: loader,
				$api: {
					Function: $api.Function,
					Events: {
						Captor: function(template) {
							var events = [];
							/** @type { ReturnType<slime.fifty.test.kit["$api"]["Events"]["Captor"]>["handler"] } */
							var initial = {};
							var handler = $api.Function.Object.entries(template).reduce(function(rv,entry) {
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

					var controlled = (ascopes) ? $context.promises.controlled() : void(0);

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
						/** @type { (p: slime.Loader) => p is slime.fifty.test.$loader } */
						function isMyLoader(p) {
							return true;
						}
						var path = parsePath(at);
						var subloader = (path.folder) ? loader.Child(path.folder) : loader;
						if (isMyLoader(subloader)) {
							if (ascopes) ascopes.push();
							var rv = recurse(ascopes, subloader, path.file, part, argument);
							if (controlled) controlled.resolve(void(0));
							if (ascopes) ascopes.pop();
							return rv;
						} else {
							throw new Error("Runtime downcast failed.");
						}
					};

					if (ascopes) {
						ascopes.current().then(run);
					} else {
						run();
					}
				},
				tests: tests,
				verify: function() {
					return verify.apply(this,arguments);
				},
				jsh: (scopes.jsh) ? $api.Object.compose(
					scopes.jsh,
					{
						//	TODO	What the heck is this doing? Can't we just provide the one from scope-jsh.ts?
						$slime: (loader && loader.jsh) ? loader.jsh.$slime : void(0)
					}
				) : void(0)
			};

			var scope = {
				fifty: fifty
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
		}

		$export(
			function(loader,path,part) {
				var ascopes = ($context.promises) ? AsynchronousScopes(
					AsynchronousScope({ name: "(top)" })
				) : void(0);
				return load(ascopes,loader,path,part);
			}
		)
	}
//@ts-ignore
)($api,$context,$loader,$export);
