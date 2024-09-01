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
		/**
		  * Whether to modify the global scope by supplying implementations of missing methods. If `true`, this module,
		  * in addition to providing the exports below, supplies implementations of the following JavaScript constructs if they are
		  * not supplied by the environment. These constructs do not currently have any automated tests implemented and thus should
		  * be treated as suspect.
		  *
		  * <div> <ul> <li>Object <ul> <li>ECMA 262v5: Object.keys</li> </ul> </li> <li>Array <ul> <li>JS 1.6: Array.prototype.indexOf</li> <li>JS 1.6: Array.prototype.filter</li> <li>JS 1.6: Array.prototype.forEach</li> <li>JS 1.6: Array.prototype.map</li> </ul> </li> </ul> </div>
		 */
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

		export const subject = (
			function(fifty: slime.fifty.test.Kit) {
				return fifty.$loader.module("module.js") as slime.$api.old.Exports;
			}
		//@ts-ignore
		)(fifty);
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
		Filter: {
			/**
			 *
			 * @param name A property name applying to a type
			 * @param filter A predicate to apply to the given property's value
			 * @returns A predicate for the given type that returns `true` if the value of its property for the given property name
			 * is accepted by the given Filter, and `false` otherwise.
			 */
			property: <T extends object,N extends keyof T>(name: N, filter: (v: T[N]) => boolean) => (t: T) => boolean

			/**
			 *
			 * @param value A target value.
			 * @returns A Filter that returns `true` if its argument equals the given target value, and `false` otherwise.
			 */
			equals: (value: any) => (v: any) => boolean

			/**
			 * Returns a filter that is the inverse of a given filter.
			 *
			 * @param f A filter to reverse.
			 * @returns A `Filter` that returns `true` when the given `Filter` returns `false`, and vice-versa.
			 */
			not: (f: (value: any) => boolean) => (value: any) => boolean

			or: any
			and: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			//	When originally implemented, Array.filter did not exist and was polyfilled
			const Array_filter = Array.prototype.filter;
			const module = old.test.subject;

			const test = function(b) {
				fifty.verify(b).is(true);
			}

			fifty.tests.exports.Filter = fifty.test.Parent();

			fifty.tests.exports.Filter.property = function() {
				type A = { a?: number };
				var f: (a: A) => boolean = module.Filter.property("a", module.Filter.equals(3));
				var array: A[] = [{ a: 3 }, {}, { a: 4 }];
				var matches = Array_filter.call(array, f);
				test(matches.length == 1);
				test(matches[0] == array[0]);

				var isUpperCase = function(value) {
					return value.toUpperCase() == value;
				}

				type AA = { a: string };

				var filter: (a: AA) => boolean = module.Filter.property("a",isUpperCase);

				var a = { a: "A" };
				var b = { a: "a" };

				test(Array_filter.call([a,b], filter).length == 1);
				test(Array_filter.call([a,b], filter)[0] == a);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Map: {
			/**
			 * A *Map* is a function that implements a particular interface: it takes a single argument, and returns a value.
			 *
			 * This function creates a Map using a property name and an optional Map.
			 *
			 * @param name A property name
			 *
			 * @param map If specified, will map its argument first, and then extract the property specified by the `name` argument.
			 *
			 * @returns A Map which returns the named property of an object. If the optional Map
			 * argument is not provided, the Map returns the named property of its argument. Otherwise, it first applies the Map
			 * argument to its argument, and then returns the named property of the result.
			 */
			property: {
				<T,R extends object,K extends keyof R>(name: K, map: (t: T) => R): (t: T) => R[K]
				<T extends object,K extends keyof T>(name: K): (t: T) => T[K]
			}

			//	TODO Map.Categorizer?

		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const module = old.test.subject;

			const test = function(b) {
				fifty.verify(b).is(true);
			};

			fifty.tests.exports.Map = function() {
				var x: { b?: { a: number }, c?: number } = {
					b: { a: 3 },
					c: 4
				};
				var one: (_: typeof x) => number = module.Map.property("c");
				var getB: (_: typeof x) => typeof x["b"] = module.Map.property("b");
				var two: (_: typeof x) => number = module.Map.property("a", getB);
				test(one(x) == 4);
				test(two(x) == 3);
				test(one({}) != 5);
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * An *Order* is a function that implements a specific interface, intended for sorting: it takes two arguments and returns a
	 * value less than zero if the first argument belongs before the second argument, and a value greater than zero if the second
	 * argument belongs before the first argument. This is commensurate with the `Array.prototype.sort` method.
	 */
	export type Order<T> = Parameters<Array<T>["sort"]>[0]

	export interface Exports {
		Order: {
			/**
			 *
			 * @param property A property name.
			 * @param order An Order to use to compare values of the given named property.
			 * @returns An Order that uses the given Order to compare the value of the named property for each of its arguments and
			 * returns the result of that comparison.
			 */
			property: <T extends object, N extends keyof T>(property: N, order: Order<T[N]>) => Order<T>

			/**
			 *
			 * @param map A Map that transforms the arguments to this Order before they are compared.
			 * @param order An Order to use to compare values produced by the given Map.
			 * @returns An Order that uses the given Order to compare the value the given Map produces for each of its arguments and
			 * returns the result of that comparison.
			 */
			map: <T extends object, A>(map: (t: T) => A, order: Order<A>) => Order<T>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const module = old.test.subject;

			const test = function(b) {
				fifty.verify(b).is(true);
			};

			fifty.tests.exports.Order = function() {
				var numerical: Order<number> = function(a,b) { return b - a; };
				var ascending: Order<number> = function(a,b) { return a - b; };
				type SV = { s: string, v: number };
				var array: SV[] = [ { s: "a", v: 2 }, { s: "b", v: 1 }, { s: "c", v: 3 } ];
				var propertyOrder: Order<SV> = module.Order.property("v", numerical);
				var mapOrder: Order<SV> = module.Order.map(module.Map.property("v"), ascending);
				array.sort( propertyOrder );
				test(array[0].s == "c");
				test(array[1].s == "a");
				test(array[2].s == "b");
				array.sort( mapOrder );
				test(array[0].s == "b");
				test(array[1].s == "a");
				test(array[2].s == "c");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Array: {
			<T>(ts: Array<T>): Array<T> & { each: any }
			new <T>(ts: Array<T>): Array<T>

			/**
			 * Converts an array into a single element. First applies the given Filter, if one is given: the Filter should be a
			 * filter that only accepts zero or one element of the array.

			 * @param array An array.
			 * @param filter An optional Filter that is used to preprocess the array.
			 * @returns The single element of the array (after applying the given Filter, if applicable), or `null` if the array has
			 * zero elements. An error is thrown if more than one element matches.
			 */
			choose: <T>(array: Array<T>, filter?: (t: T) => boolean) => T

			toValue: any
			categorize: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const module = old.test.subject;

			const test = function(b) {
				fifty.verify(b).is(true);
			};

			fifty.tests.exports.Array = function() {
				test( module.Array.choose([ 3 ]) == 3 );
				test( module.Array.choose([]) === null );
				test( module.Array.choose([ 1, 2, 3 ], function(a) { return a == 3; } ) == 3 );
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Error: any
	}

	export interface Tell<O,T> {
		(this: O, e: Error, t: T): void
		(this: O, result: { threw: Error } | { returned: T }): void
	}

	export interface Exports {
		Task: {
			tell: <O,T>(p: {
				target?: O
				tell: Tell<O,T>
				threw?: Error
				returned?: T
			}) => void
		}
	}

	export interface Exports {
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
