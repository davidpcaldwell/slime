//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * An older module containing general JavaScript utilities.
 *
 * @deprecated Replaced by {@link slime.$api.Global}.
 */
namespace slime.$api.old {
	export interface Context {
		globals: boolean
	}

	export namespace test {
		export const Functions = function() {
			var calculator = Object.assign(function() {
				calculator.invocations++;
				return 2*2;
			}, {
				invocations: 0
			});

			var undefinedCalculator = Object.assign(function() {
				undefinedCalculator.invocations++;
				return;
			}, {
				invocations: 0
			});

			return {
				calculator: calculator,
				undefinedCalculator: undefinedCalculator
			};
		};
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Defines a property on an object which is lazy-instantiated by a function the first time it is accessed.
		 *
		 * The property is effectively constant. The first time the property is accessed, the given function will be invoked to
		 * define the value, which will be returned as the value (without invoking the function) each time it is accessed.
		 * The property will be enumerable.
		 *
		 * This function is only present if Object.defineProperty is available.
		 *
		 * @param a An object on which to define a property
		 * @param n The name of the property to define
		 * @param v The function that will be invoked to define the property's value, when/if necessary.
		 * @returns The object, augmented with the new property.
		 */
		lazy?: <T extends object,K extends string,V>(a: T, n: K, v: () => V) => T & { [k in K]: V }
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module = fifty.$loader.module("module.js");

			var Functions = function() {
				var calculator = Object.assign(function() {
					calculator.invocations++;
					return 2*2;
				}, {
					invocations: 0
				});

				var undefinedCalculator = Object.assign(function() {
					undefinedCalculator.invocations++;
					return;
				}, {
					invocations: 0
				});

				this.calculator = calculator;
				this.undefinedCalculator = undefinedCalculator;
			}

			fifty.tests.exports.lazy = function() {
				var f = new Functions();

				var test = function(b) {
					verify(b).is(true);
				}

				var math = module.lazy({}, "four", f.calculator);
				test( f.calculator.invocations == 0 );
				test( math.four == 4 );
				test( f.calculator.invocations == 1 );
				test( math.four == 4 );
				test( f.calculator.invocations == 1 );

				math = module.lazy(math, "undefined", f.undefinedCalculator);
				test( f.undefinedCalculator.invocations == 0 );
				test( typeof(math.undefined) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
				test( typeof(math.undefined) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Creates a function which caches the result of an underlying function.
		 *
		 * It stores the result before returning it, and returns the stored result for every succeeding invocation.
		 *
		 * @param f A function to which the returned function will delegate the first time.
		 * @returns The created function.
		 */
		constant: <T>(f: () => T) => () => T
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module: Exports = fifty.$loader.module("module.js");

			var test = function(b) {
				verify(b).is(true);
			}

			fifty.tests.exports.constant = function() {
				var f = old.test.Functions();

				var constantCalculator = module.constant(f.calculator);
				verify(f.calculator.invocations).is(0);
//					test( f.calculator.invocations == 0 );
				verify(constantCalculator()).is(4);
//					test( constantCalculator() == 4 );
				verify(f.calculator.invocations).is(1);
//					test( f.calculator.invocations == 1 );
				verify(constantCalculator()).is(4);
//					test( constantCalculator() == 4 );
				verify(f.calculator.invocations).is(1);
//					test( f.calculator.invocations == 1 );

				var undefinedConstantCalculator = module.constant(f.undefinedCalculator);
				test( f.undefinedCalculator.invocations == 0 );
				test( typeof(undefinedConstantCalculator()) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
				test( typeof(undefinedConstantCalculator()) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		//	TODO	Can toLiteral be broken by setting up two objects that refer to one another? Or an object that refers to itself?

		/**
		 * @deprecated `JSON.stringify` is now the standard way to do this, and other code should be migrated.
		 *
		 * Converts a JavaScript value to a string literal.
		 * The literal can be reconstituted into the original using `eval()`. Converts only values of types `object`, `string`,
		 * `number`, `boolean`, and `undefined`, only including properties of `object` values which are one of those types.
		 *
		 * Objects are represented by the values of their enumerable properties (or, if they have properties of an object type, by
		 * the literal resulting from calling this function with the value of that property), with the exception of `Array` and
		 * `Date` values, which are represented by calls to the `Array` and `Date` constructors.
		 *
		 * @param value A value of a permitted type to convert to a string literal.
		 * @returns A literal representation of the given value.
		 */
		toLiteral: (value: any) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module = fifty.$loader.module("module.js");

			var test = function(b) {
				verify(b).is(true);
			}

			fifty.tests.exports.toLiteral = fifty.test.Parent();

			fifty.tests.exports.toLiteral._1 = function() {
				var thaw = function(v) {
					var s = module.toLiteral(v);
					var rv;
					eval("rv = " + s);
					return rv;
				}

				var toLiteral = module.toLiteral;

				test(toLiteral("David") == "\"David\"");
				test(toLiteral(2) == "2");
				test(toLiteral(true) == "true");

				var o: any | { s?: string, u?: any, a?: boolean, b?: string, c?: Date } = { s: void(0), u: void(0), a: void(0), b: void(0), c: void(0) };
				var u;
				o.s = "s";
				o.u = u;
				var t = thaw(o);
				test("s" in t);
				test(typeof(t.s) != "undefined");
				test("u" in t);
				test(typeof(t.u) == "undefined");

				var now = new Date();
				o = {
					a: true,
					b: "David",
					c: now
				};
				t = thaw(o);
				test(t.a === true);
				test(t.b == "David");
				test(t.c.getTime() == now.getTime());

				o = [1, "David", true, { x: "y" }];
				t = thaw(o);
				test(t.length == 4);
				test(t[0] == 1);
				test(t[1] == "David");
				test(t[2] === true);
				test(t[3].x == "y");
			}

			fifty.tests.exports.toLiteral._2 = function() {
				var reference = {
					circular: void(0)
				};
				var circular = {
					reference: reference
				};
				reference.circular = circular;

				var expectError = function(f,filter) {
					try {
						f();
						test(false);
					} catch (e) {
						if (!filter) {
							test(true);
						} else {
							test(filter(e));
						}
					}
				}

				expectError(function() {
					return module.toLiteral(circular);
				}, function(e) {
					return /^Recursion/.test(e.message);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * An object capable of mapping one object type onto another.
	 *
	 * The object invokes a series of operations to map an input object to an output object. These operations are specified by
	 * invoking the `add()` and `addMapping()` methods to configure the object, before invoking the `transform` method to map
	 * objects. Each step receives a "current" object as input and emits a "next" object as output. The "current" object for the
	 * first step is the object used as an argument to `transform()`, and the `transform()` method returns the "next" object emitted
	 * from the last step.
	 */
	export interface ObjectTransformer {
		/**
		 * Adds a function to the mapping chain which receives the current object as an argument and returns the next object.
		 *
		 * @param f A function which takes a value and returns a value.
		 */
		add: (f: (v: any) => any) => void

		/**
		 * Adds a step to the mapping chain in which the current object is passed through the given mapping object, and each
		 * property of the current value is transformed as follows:
		 *
		 * * If the named property is not present in the mapping object, it is simply passed through to the next step.
		 * * If the named property is `null` in the mapping object, it is not passed through to the next step (it is essentially deleted).
		 * * If the named property is a `function` in the mapping object, in the next step it will be set to the value the function returns.  The function will be invoked with two arguments.  The first argument will be the current value of the property (or `undefined` if the object in the current step does not have the given property), and the second will be the current object.
		 *
		 * Finally, if the mapping object contains a named property of type `function` not contained in the current object, the
		 * value of this property will be assigned by invoking the given function with values of `undefined` and the current object.
		 *
		 * @param o An object which specifies the mapping to use for this step.
		 * @returns
		 */
		addMapping: (o: object) => void

		/**
		 * Passes the given argument through the mapping chain, invoking each step in succession, and returning the output of the
		 * last step.
		 *
		 * @param o An object to transform.
		 * @returns The output of the transformation.
		 */
		transform: (o: object) => object

		/**
		 * Returns a function which wraps this object; the function takes one argument (an object) and returns the same result that
		 * would be returned by the `transform` method of this object.
		 *
		 * @returns A function which transforms objects using this ObjectTransformer.
		 */
		toFunction: () => (o: object) => object
	}

	export interface Exports {
		ObjectTransformer: new () => ObjectTransformer
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module = fifty.$loader.module("module.js");

			var test = function(b) {
				verify(b).is(true);
			}

			fifty.tests.exports.ObjectTransformer = function() {
				var xDoubler = function(o) {
					return { x: o.x+o.x, y: 2, z: "David", a: true, b: true, c: true }
				}

				var hasher = {
					a: function(v,o) {
					},
					b: function(v,o) {
						return null;
					},
					y: null,
					z: function(v,o) {
						return v + v + o.x;
					}
				};

				var input = { x: 1 };
				var first = new module.ObjectTransformer();
				first.add(xDoubler);
				var output = first.transform(input);
				test(output.x == 2);
				test(output.y == 2);
				test(output.z == "David");

				var second = new module.ObjectTransformer();
				second.add(xDoubler);
				second.addMapping(hasher);
				output = second.transform(input);
				test(output.x == 2);
				test(!("y" in output));
				test(output.z == "DavidDavid2");
				test("a" in output && typeof(output.a) == "undefined");
				test("b" in output && output.b === null);
				test(output.c === true);

				var secondFunction = second.toFunction();
				var fOutput = secondFunction(input);
				test(fOutput.x == 2);
				test(fOutput.c === true);
				test(fOutput.z == "DavidDavid2");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		properties: any
	}

	export namespace object {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Object = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			keys: any
			values: any
			pairs: any
		}

		export interface Exports {
			/**
			 * @experimental
			 *
			 * Given a list of objects, uses the second and succeeding arguments to set properties of the first argument.
			 *
			 * @param target An object to modify (and return).
			 * @param setters objects whose properties will be used to set the properties of the first object. Later arguments take
			 * precedence over earlier arguments. So if there are three arguments: objects A, B, and C, and objects B and C both
			 * contain a property *x*, then after this method is invoked, A.x == C.x (not A.x == B.x). If any of the extra arguments
			 * is `null` or `undefined`, it is ignored.
			 * @returns The first object.
			 */
			set: (target: any, ...setters: any[]) => any
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				var module = fifty.$loader.module("module.js");

				var test = function(b) {
					verify(b).is(true);
				}

				fifty.tests.exports.Object.set = function() {
					//	TODO	test enforcement that first argument must be object and must not be null
					var set = module.Object.set;
					var a = set({}, { a: 2 });
					test(a.a == 2);
					var b = set({}, { a: 1 }, { a: 2 });
					test(b.a == 2);
					var c = set({}, null, { a: 2 }, (function(){})());
					test(c.a == 2);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			path: any
			expando: any
		}
	}

	export interface Exports {
		Object: object.Exports
	}

	export interface Exports {
		/**
		 * @deprecated Use `$api.fp`.
		 */
		Function: slime.$api.Global["fp"]
	}

	export interface Exports {
		Filter: any
		Map: any
		Order: any
		Array: any
		Error: any
		Task: any

		/**
		 * @deprecated
		 */
		deprecate: slime.$api.Global["deprecate"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.load("Error.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}
