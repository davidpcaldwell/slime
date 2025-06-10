//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.old.Context } $context
	 * @param { slime.$api.fp.internal.old.Exports } $exports
	 */
	function($context,$exports) {
		$exports.Function = Object.assign(
			$context.deprecate(function() {
				var UNDEFINED = {};

				var Result = function() {
					this.error = void(0);
					this.throwing = void(0);
					this.returning = void(0);

					this.resolve = function() {
						if (this.error) {
							throw this.throwing;
						} else {
							if (this.returning === UNDEFINED) return void(0);
							return this.returning;
						}
					};
				};

				var Situation = function() {
					var result = new Result();

					this.target = arguments[0];
					this.arguments = arguments[1];

					this.setReturn = function(v) {
						result.error = false;
						result.returning = v;
					};

					this.setThrow = function(v) {
						result.error = true;
						result.throwing = v;
					};

					this.result = result;

					this.resolve = function() {
						return result.resolve();
					};
				};

				var components = [];

				if (arguments.length != 1) {
					throw new TypeError("$api.Function expected 1 argument.");
				} else {
					components.push(new $exports.Function.Basic(arguments[0]));
				}

				var rv = function() {
					var situation = new Situation(this,Array.prototype.slice.call(arguments));
					components.forEach(function(component) {
						component.call(situation);
					});
					return situation.resolve();
				};

				rv.prepare = function() {
					for (var i=0; i<arguments.length; i++) {
						components.splice(i,0,new $exports.Function.Prepare(arguments[i]));
					}
					return this;
				}

				rv.revise = function() {
					for (var i=0; i<arguments.length; i++) {
						components.push(new $exports.Function.Revise(arguments[i]));
					}
					return this;
				}

				return rv;
			}),
			{
				preprocessing: void(0),
				postprocessing: void(0),
				value: void(0),
				mutating: void(0),
				Basic: void(0),
				Revise: void(0),
				Prepare: void(0),
				singleton: void(0),
				set: void(0)
			}
		);

		$exports.Function.value = {
			UNDEFINED: {
				toString: function() {
					return "Function.UNDEFINED";
				}
			}
		};
		$context.deprecate($exports.Function, "value");

		$exports.Function.mutating = $context.deprecate(function(v) {
			var implementation;
			if (typeof(v) == "function") {
				var mutator = v;
				implementation = function(value) {
					var returned = mutator(value);
					if (returned === $exports.Function.value.UNDEFINED) return void(0);
					if (typeof(returned) == "undefined") return value;
					return returned;
				}
			} else if (typeof(v) == "object" && v) {
				implementation = function() {
					return v;
				};
			} else if (typeof(v) == "undefined") {
				implementation = function(v) { return v; };
			}
			return function() {
				if (arguments.length != 1) throw new TypeError("mutating() must be invoked with one argument representing the value to mutate.");
				return implementation.apply(this, arguments);
			}
		});

		$exports.Function.Basic = $context.deprecate(function(f) {
			return function() {
				try {
					this.setReturn(f.apply(this.target,this.arguments));
				} catch (e) {
					this.setThrow(e);
				}
			};
		});

		$exports.Function.Revise = $context.deprecate(function(f) {
			return function() {
				this.setReturn(f.call({
					target: this.target,
					arguments: this.arguments,
					throwing: this.result.throwing,
					returning: this.result.returning
				},this.result.returning));
			};
		});

		$exports.Function.Prepare = $context.deprecate(function(f) {
			return function() {
				var situation = this;
				f.apply({
					setThis: function(v) {
						situation.target = v;
					},
					setArguments: function(v) {
						situation.arguments = Array.prototype.slice.call(v);
					}
				},situation.arguments);
			}
		});

		$exports.Function.singleton = $context.deprecate(function(f) {
			var memo;

			return function() {
				if (!memo) {
					memo = {
						result: f()
					}
				}
				return memo.result;
			};
		});

		$exports.Function.set = $context.deprecate(function(o) {
			return function() {
				for (var x in o) {
					this[x] = o[x];
				}
			};
		});
	}
//@ts-ignore
)($context,$exports);
