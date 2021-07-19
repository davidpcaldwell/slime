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
		 * @param { string } name
		 * @param { () => void } execute
		 * @returns { boolean }
		 */
		var executeTestScope = function(name,execute) {
			start(name);
			var was = {
				scope: scope,
				verify: verify
			};
			scope = Scope({ parent: scope });
			verify = $context.library.Verify(
				function(f) {
					scope.test(f);
				}
			);

			execute();

			function after() {
				var result = scope.success;
				scope = was.scope;
				verify = was.verify;
				if (scope) {
					scope.end(name,result);
				} else {
					console.end(null, name, result);
				}
				return result;
			}

			return after();
		}

		/**
		 *
		 * @param { slime.fifty.test.tests } tests
		 * @returns
		 */
		var runner = function(tests) {
			/**
			 * @template { any } T
			 * @param { (t: T) => void } code
			 * @param { string } name essentially for display when reporting results
			 * @param { T } [argument]
			 * @returns { boolean }
			 */
			var rv = function(code,name,argument) {
				return executeTestScope(
					(name) ? name : getContainerName(tests,code),
					function() {
						try {
							code(argument);
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
		 * @param { slime.fifty.test.$loader } loader
		 * @param { string } path
		 * @param { string } part - the part to execute. If `undefined`, the default value `"suite"` will be used.
		 * @param { any } [argument]
		 * @returns { boolean }
		 */
		var load = function recurse(loader,path,part,argument) {
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
					runner(tests)(f, name);
				},
				load: function(at,part,argument) {
					/** @type { (p: slime.Loader) => p is slime.fifty.test.$loader } */
					function isMyLoader(p) {
						return true;
					}
					var path = parsePath(at);
					var subloader = (path.folder) ? loader.Child(path.folder) : loader;
					if (isMyLoader(subloader)) {
						recurse(subloader, path.file, part, argument);
					} else {
						throw new Error("Runtime downcast failed.");
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
					var rv = runner(tests)(callable, path + ":" + part, argument);
					return rv;
				} else {
					throw new TypeError("Not a function: " + part);
				}
			} else {
				error(path, loaderError);
				// return runner(tests)
			}
		}

		$export(
			function(loader,path,part) {
				return load(loader,path,part);
			}
		)
	}
//@ts-ignore
)($api,$context,$loader,$export);
