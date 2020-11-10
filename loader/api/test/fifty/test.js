//@ts-check
(
	/**
	 * @param { $api } $api
	 * @param { { library: { verify: slime.definition.verify.Exports }, console: slime.fifty.test.internal.Console } } $context
	 * @param { any } $export
	 */
	function($api,$context,$export) {
		var Verify = $context.library.verify.Verify;
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

				this.parent = (p.parent) ? p.parent : null;

				this.depth = function() {
					return (this.parent) ? this.parent.depth() + 1 : 0;
				};

				this.toString = function() {
					return "Scope: " + this.depth();
				}

				this.start = function(name) {
					console.start(this.depth() + 1, name);
				}

				this.end = function(name,result) {
					console.end(this.depth() + 1, name, result);
				}

				this.fail = function() {
					this.success = false;
					if (p.parent) p.parent.fail();
				}

				/** @type { slime.definition.verify.Scope["test"] } */
				this.test = function(f) {
					var result = f();
					if (result.success === false) {
						this.fail();
					} else if (result.success === true) {
						//	do nothing
					} else {
						throw new TypeError();
					}
					console.test(this.depth() + 1, result.message);
				}
			}
		}

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

		var scope = Scope();
		var verify = Verify(scope);

		var tests = {
			types: {}
		};

		//	TODO	loader below should be slime.fifty.test.Loader
		$export(
			/**
			 * @param { slime.fifty.test.$loader } loader
			 * @param { string } path
			 * @param { { [x: string]: any } } vars
			 * @param { string } part
			 * @returns { boolean }
			 */
			function(loader,path,vars,part) {
				loader.run(path, $api.Object.compose(vars, {
					jsh: jsh,
					$loader: loader,
					run: function(code,name) {
						if (!code) throw new TypeError("Cannot run scope " + code);
						if (!name) name = $api.Function.result(
							getPropertyPathFrom(tests)(code),
							function(array) {
								return (array) ? array.join(".") : array;
							}
						);
						if (!name) name = "run";
						scope.start(name);
						var was = {
							scope: scope,
							verify: verify
						};
						scope = Scope({ parent: scope });
						verify = Verify(scope);
						code();
						var result = scope.success;
						scope = was.scope;
						verify = was.verify;
						scope.end(name,result);
					},
					tests: tests
				}, new function() {
					this.verify = function() {
						return verify.apply(this,arguments);
					}
				}));

				/** @type { any } */
				var target = tests;
				part.split(".").forEach(function(token) {
					target = $api.Function.optionalChain(token)(target)
				});
				if (typeof(target) == "function") {
					/** @type { () => void } */
					var callable = target;
					//	TODO	probably should print test being run as well in case part is not suite
					console.start(0, path + ":" + part);
					callable();
					console.end(0, path + ":" + part, scope.success);
				} else {
					throw new TypeError("Not a function: " + part);
				}

				return scope.success;
			}
		)
	}
//@ts-ignore
)($api,$context,$export);
