//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

interface Function {
	construct: any
}

/**
 * The `$api` object is provided to all code loaded by the platform loader. It provides basic JavaScript language functionality.
 *
 * The `$api.fp` namespace provides functional programming constructs. See {@link slime.$api.fp}.
 *
 * Various `$api` methods can "flag" APIs for callers, causing a configurable callback to be executed when they are invoked, to warn
 * the users that the APIs are deprecated or experimental. See the `deprecate` and `experimental` functions of {@link slime.$api.Global |
 * `$api`}.
 */
namespace slime.$api {
	export type Function = (...args: any[]) => any

	(
		function(fifty: slime.fifty.test.Kit) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace fp {
		export interface Exports {
			methods: slime.$api.fp.methods.Exports
		}
	}

	export interface Global {
		fp: fp.Exports
	}

	export interface Global {
		global: {
			get: <T>(propertyName: string) => T
		}
	}

	export interface Global {
		debug: {
			disableBreakOnExceptionsFor: <T,P extends any[],R,F extends slime.external.lib.es5.Function<T,P,R>>(f: F) => F
		}

		/**
		 * @deprecated Use constructs from {@link slime.$api.fp.Exports.Predicate | $api.fp.Predicate}.
		 */
		Filter: {
			/**
			 * @deprecated Use {@link slime.$api.fp.Exports.Predicate["and"] | $api.fp.Predicate.and }. }
			 */
			and: slime.$api.fp.Exports["Predicate"]["and"]

			/**
			 * @deprecated Use {@link slime.$api.fp.Exports.Predicate["or"] | $api.fp.Predicate.or }. }
			 */
			or: slime.$api.fp.Exports["Predicate"]["or"]
		}

	}

	export interface Global {
		Key: {
			by: {
				<K,T>(p: {
					count: true
					keys?: K[]
					codec?: slime.Codec<K,string>
					key: (t: T) => K
					array: T[]
				}): {
					[key: string]: number
				}

				<K,T>(p: {
					keys?: K[]
					codec?: slime.Codec<K,string>
					key: (t: T) => K
					array: T[]
				}): {
					[key: string]: T[]
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			fifty.tests.exports.Key = function() {
				var array = [
					{ a: 1, b: 2 },
					{ a: 1, b: 3 },
					{ a: 2, b: 4 },
					{ a: 1, b: 5 }
				];

				var lists = api.Key.by({
					key: function(value) {
						return value.a;
					},
					array: array
				});
				verify(lists)[1].length.is(3);
				verify(lists)[2].length.is(1);

				var counts = api.Key.by({
					key: function(value) {
						return value.a;
					},
					count: true,
					array: array
				});
				verify(counts)[1].is(3);
				verify(counts)[2].is(1);
				verify(counts).evaluate.property(3).is(void(0));

				var countKeys = api.Key.by({
					keys: [1,2,3],
					key: function(value) {
						return value.a;
					},
					count: true,
					array: array
				});
				verify(countKeys)[1].is(3);
				verify(countKeys)[2].is(1);
				verify(countKeys)[3].is(0);
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Global {
		Constructor: {
			invoke: <C extends new (...args: any) => any>(p: {
				constructor: C
				arguments?: ConstructorParameters<C>
			}) => InstanceType<C>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			fifty.tests.exports.Constructor = function() {
				verify(api).evaluate.property("Constructor").is.not(void(0));
				verify(api).Constructor.evaluate.property("invoke").is.not(void(0));

				//@ts-ignore
				var A: new (a?: number, b?: number) => { a: number, b: number } = function(a,b) {
					this.a = a;
					this.b = b;
				};

				var a1 = api.Constructor.invoke({
					constructor: A,
					arguments: [1,2]
				});
				verify(a1).a.is(1);
				verify(a1).b.is(2);

				var a2 = api.Constructor.invoke({
					constructor: A,
					arguments: [1]
				});
				verify(a2).a.is(1);
				verify(a2).b.is(void(0));

				var a3 = api.Constructor.invoke({
					constructor: A,
					arguments: []
				});
				verify(a3).a.is(void(0));
				verify(a3).b.is(void(0));

				(function omittedArguments() {
					var a = api.Constructor.invoke({
						constructor: A
					});
					verify(a).a.is(void(0));
					verify(a).b.is(void(0));
				})();
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Global {
		/**
		 * Contains constructs related to *Iterable* objects, as defined by
		 * [ES2015](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).
		 */
		Iterable: {
			/**
			 * Collates an iterable set of values of type V (extends any) into groups of type G (extends any) (or counts the number of
			 * values in each group) based on a specified set of criteria.
			 *
			 * @param p
			 */
			groupBy<V,G> (p: {
				/**
				 * A set of elements to group.
				 */
				array: Array<V>

				/**
				 * Returns the group to which a given element should belong.
				 */
				group: (element: V) => G

				/**
				 * A set of groups to use in the output. Note that the `group` function still is responsible for grouping, so if it
				 * returns groups not in this set, they will be included in the output. This value is for the purpose of
				 * _guaranteeing_ certain elements will be returned (even with empty lists or zero counts).
				 */
				groups?: Array<G>

				/**
				 * If `G` is not `string`, converts `G`s to and from `string`.
				 */
				codec?: {
					/**
					 * Converts a G to a `string`.
					 * @param group A group.
					 * @returns A distinct string identifying the given group.
					 */
					encode: (group: G) => string

					/**
					 * Converts a `string` to a G.
					 * @param string An encoded group.
					 * @returns A group.
					 */
					decode: (string: string) => G
				}

				/**
				 * If `true`, a number is returned for each group indicating how many elements were in the group. If `false, an
				 * array of all the elements for each group is returned.
				 */
				count?: boolean
			}) : {
				array: () => Array<{
					group: G
					array?: V[],
					count?: number
				}>
			},

			/**
			 * A function that operates on two lists, called `left` and `right`, pertaining to a common underlying set. Callers
			 * specify a `matches` function that can determine which elements on each side
			 * <dfn>match</dfn> , or pertain to the same logical element in the set. The method will identify which elements from
			 * each list match, and which from each list remain unmatched after searching for matches. The results will be returned;
			 * optionally, a callback can be invoked for each element based on the result for that element.
			 *
			 * @param p
			 */
			match<L,R> (
				p: {
					left: L[],
					right: R[],
					/**
					 * @param l An element from `left`.
					 * @param r An element from `right`.
					 * @returns `true` if the two elements *match* , that is, pertain to the same element in the underlying set.
					 */
					matches: (l: L, r: R) => boolean,
					unmatched?: {
						/**
						 * A callback invoked for each item from `left` that does not match.
						 *
						 * @param l The element from `left`.
						 */
						left?: (l: L) => void,
						/**
						 * A callback invoked for each item from `right` that does not match.
						 *
						 * @param r The element from `right`.
						 */
						 right?: (r: R) => void
					},
					/**
					 * A callback invoked for each pair of items that matches.
					 */
					matched?: (p: {
						/**
						 * An element from `left`.
						 */
						left: L,
						/**
						 * An element from `right`.
						 */
						right: R
					}) => void
				}
			): {
				unmatched: {
					left: L[],
					right: R[]
				},
				matched: {
					left: L,
					right: R
				}[]
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var { verify } = fifty;
			var { $api } = fifty.global;

			fifty.tests.exports.Iterable = function() {
				var groups = [
					{ id: "A" },
					{ id: "B" },
					{ id: "C" }
				];

				var findGroup = function(letter) {
					return groups.filter(function(group) {
						return group.id == letter;
					})[0];
				};

				var group = function(s) {
					return findGroup(s.substring(0,1).toUpperCase());
				};

				var codec = {
					encode: function(group) {
						return group.id;
					},
					decode: function(string) {
						return findGroup(string)
					}
				};

				var words = ["ant", "ancillary", "cord"];

				var grouped = $api.Iterable.groupBy({
					array: words,
					group: group,
					groups: groups,
					codec: codec,
					count: false
				}).array();

				verify(grouped).length.is(3);
				verify(grouped)[0].array.length.is(2);
				verify(grouped)[1].array.length.is(0);
				verify(grouped)[2].array.length.is(1);

				var counted = $api.Iterable.groupBy({
					array: words,
					group: group,
					groups: groups,
					codec: codec,
					count: true
				}).array();

				verify(counted).length.is(3);
				verify(counted)[0].count.is(2);
				verify(counted)[1].count.is(0);
				verify(counted)[2].count.is(1);

				fifty.run(function match() {
					const api = $api;

					var left = ["a", "b"];
					var right = ["B", "C"];
					var matches = function(a,b) {
						return a.toLowerCase() == b.toLowerCase();
					};

					var recordingFunction = function() {
						var rv: {
							(): void
							received: any[][]
						} = Object.assign(
							function() {
								rv.received.push(Array.prototype.slice.call(arguments));
							},
							{
								received: []
							}
						);
						return rv;
					};

					var onLeft = recordingFunction();
					var onRight = recordingFunction();
					var onMatch = recordingFunction();

					var result = api.Iterable.match({
						left: left,
						right: right,
						matches: matches,
						unmatched: {
							left: onLeft,
							right: onRight
						},
						matched: onMatch
					});
					verify(result).unmatched.left.length.is(1);
					verify(result).unmatched.right.length.is(1);
					verify(result).matched.length.is(1);
					verify(onLeft.received).length.is(1);
					verify(onLeft.received)[0].length.is(1);
					verify(onRight.received).length.is(1);
					verify(onRight.received)[0].length.is(1);
					verify(onMatch.received).length.is(1);
					verify(onMatch.received)[0].length.is(1);
					verify(onMatch.received)[0][0].left.is.type("string");
					verify(onMatch.received)[0][0].right.is.type("string");
				})
			}
		}
	//@ts-ignore
	)(fifty);

	export type Property = { name: string, value: any }

	export type Properties = Omit<Array<Property>,"filter"> & {
		filter: (f: (element: { name: string, value: any }) => boolean) => Properties
		object: () => object
	}

	export interface Global {
		/** @deprecated Duplicates functionality of Object.entries and Object.fromEntries */
		Properties: {
			(): Properties
			(p: { array: Property[] } | { object: object }): Properties
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			fifty.tests.exports.Properties = function() {
				var empty = api.Properties();
				verify(empty).length.is(0);

				verify(api).evaluate(function(api) {
					//@ts-ignore
					return api.Properties(null);
				}).threw.type(TypeError);

				verify(api).Properties({ array: [ { name: "foo", value: "bar" } ] }).length.is(1);

				verify(api).Properties({ object: { foo: "bar" } }).length.is(1);
				verify(api).Properties({ object: { foo: "bar" } })[0].name.is("foo");
				verify(api).Properties({ object: { foo: "bar" } })[0].value.evaluate(String).is("bar");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		/**
		 * Methods pertaining to the JavaScriot _object_ construct.
		 */
		export interface Object {
		}
	}

	export interface Global {
		Object: exports.Object & {
			/** @deprecated Replicates functionality of Object.fromEntries */
			(p: { properties: {name: string, value: any }[] }): { [x: string]: any }
		}

	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Object = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			fifty.tests.exports.Object["()"] = function() {
				var properties = [{ name: "foo", value: "bar" }, { name: "a", value: "b" }];
				var object = api.Object({ properties: properties });
				verify(object).foo.evaluate(String).is("bar");
				verify(object).a.evaluate(String).is("b");
			}
		}
	//@ts-ignore
	)(fifty);

	export type es5Object = Object

	export namespace exports {
		export interface Object {
			/**
			 * Takes a list of objects and composes them into a new object. Properties are copied from each source object in
			 * succession, with values from later objects replacing those from earlier objects.
			 */
			compose: {
				<T>(t: T): slime.js.NotReadonly<T>
				//	TODO	below should be NotReadonly also, but they currently cause problems that need to be worked through.
				<T,U>(t: T, u: U): T & U
				<T,U,V>(t: T, u: U, v: V): T & U & V
				<T,U,V,W>(t: T, u: U, v: V, w: W): T & U & V & W
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const api = fifty.global.$api;

				fifty.tests.exports.Object.compose = function() {
					(function() {
						var composed = api.Object.compose({ a: 1, b: 1 }, { a: 2 });
						verify(composed).a.is(2);
						verify(composed).b.is(1);
					})();
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Object {
			/**
			 * Provides an optional chaining API that seeks to be maximally compatible with the [standard
			 * implementation](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#prod-OptionalExpression).
			 *
			 * The first argument is an object to dereference. Further arguments are a series of properties to access. If any
			 * property but the last is missing, `undefined` will be returned. Otherwise, the value of the last property will be
			 * returned.
			 *
			 * @returns The value of the property chain for the given object, or `undefined` if the chain is incomplete.
			 */
			optional: {
				<O extends es5Object, K extends keyof O>(o: O, k: K): O[K]
				<O extends es5Object, K extends keyof O, L extends keyof O[K]>(o: O, k: K, l: L): O[K][L]
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.Object.optional = function() {
					var a: { b: { c: number, n: number }, c?: { x: string } } = {
						b: {
							c: null,
							n: 2
						}
					};
					verify($api.Object.optional(a, "b", "c")).is(null);
					verify($api.Object.optional(a, "b", "n")).is(2);
					verify($api.Object.optional(a, "c", "x")).is(void(0));

					var x: { x: string } = null;
					verify($api.Object.optional(x, "x")).is(void(0));
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Object {
			/**
			 * Returns the list of properties for an object.
			 *
			 * @deprecated Duplicates logic better-represented by `Object.entries`.
			 */
			properties: (p: object) => Properties
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const api = fifty.global.$api;

				fifty.tests.exports.Object.properties = function() {
					var o = { a: 1, b: 2 };
					var properties = api.Object.properties(o);
					verify(properties).length.is(2);

					var rebuilt = properties.object();
					verify(rebuilt).evaluate.property("a").is(1);
					verify(rebuilt).evaluate.property("b").is(2);

					var filtered = api.Object.properties(o).filter(function(property) {
						return property.name == "a";
					}).object();
					verify(filtered).evaluate.property("a").is(1);
					verify(filtered).evaluate.property("b").is(void(0));
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Object {
			values: {
				/**
				 * @experimental Completely untested.
				 */
				map: <O,T,R>(f: (t: T) => R) => (o: { [x in keyof O]: T } ) => { [x in keyof O]: R }
			}
		}

		export interface PropertyDescriptor<T> {
			configurable?: boolean;
			enumerable?: boolean;
			value?: T;
			writable?: boolean;
			get?(): T;
			set?(v: T): void;
		}

		export interface Object {
			defineProperty: <N extends string,V>(p: {
				name: N
				descriptor: PropertyDescriptor<V>
			}) => <T extends object>(t: T) => T & { [n in N]: V }

			maybeDefineProperty: <T extends object,N extends string,V>(p: {
				name: N
				descriptor: slime.$api.fp.Partial<T,PropertyDescriptor<V>>
			}) => (t: T) => T & { [n in N]?: V }
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				type A = { a: number };

				var a: A = { a: 1 };

				fifty.tests.exports.Object.defineProperty = function() {
					var bb = $api.fp.now(
						a,
						$api.Object.defineProperty({
							name: "b",
							descriptor: {
								value: 2,
								enumerable: true
							}
						})
					);

					var bbb = $api.Object.defineProperty({
						name: "b",
						descriptor: {
							value: 2,
							enumerable: true
						}
					})({ a: 2 });

					verify(bb).b.is(2);
					verify(bbb).b.is(2);
				}

				fifty.tests.exports.Object.maybeDefineProperty = function() {
					var applies = function(it: A) {
						return it.a % 2 == 0;
					};

					var withMaybeProperty = $api.Object.maybeDefineProperty({
						name: "c",
						descriptor: function(a: A) {
							return applies(a) ? $api.fp.Maybe.from.some({ value: true }) : $api.fp.Maybe.from.nothing();
						}
					});

					var hasOwnProperty: (name: string) => (o: object) => boolean = function(name) {
						return function(o) {
							return o.hasOwnProperty(name);
						}
					};

					var yes = $api.fp.now(
						a,
						withMaybeProperty
					);

					var no = $api.fp.now(
						{ a: 2 },
						withMaybeProperty
					);

					verify(yes).evaluate(hasOwnProperty("c")).is(false);
					verify(no).evaluate(hasOwnProperty("c")).is(true);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Global {
		Array: {
			/**
			 * Creates an array by creating an empty array and passing it to the given function to populate.
			 */
			build: <T>(f: (p: T[]) => void) => T[]
		}

		Value: (value: any, name: string) => {
			/**
			 * A method that throws a `TypeError` if the value is falsy.
			 */
			require: () => void

			/**
			 * A method that creates a `Value` representing a property or subproperty of this `Value`.
			 */
			property: (...names: string[]) => ReturnType<Global["Value"]>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			//	TODO	This value now appears not to exist
			const HAS_NASHORN_ERROR_HACK = false;

			fifty.tests.exports.Value = fifty.test.Parent();

			fifty.tests.exports.Value.require = function() {
				verify(api.Value).is.not.equalTo(void(0));
				var one = {
					name: "value1",
					nested: {
						value: "nested1",
						method: function() {
							return "method";
						}
					}
				};
				var value = api.Value(one,"one");

				//	TODO	make this work?
				var disableBreakOnExceptions = function(f) { return f; };

				disableBreakOnExceptions(function() {
					verify(value).evaluate(function() { return this.require(); }).threw.nothing();
					verify(value).property("foo").evaluate(function() { return this.require() }).threw.type(TypeError);
					verify(value).property("foo").evaluate(function() { return this.require(); }).threw.message.is("one.foo is required");
					if (!HAS_NASHORN_ERROR_HACK) {
						verify(value).evaluate(function() { return this.property("foo","bar"); }).threw.type(TypeError);
					}
					verify(value).property("name").evaluate(function() { return this.require() }).threw.nothing();
					verify(value).property("name","length").evaluate(function() { return this.require() }).threw.nothing();
					verify(value).property("nested","value").evaluate(function() { return this.require() }).threw.nothing();
					verify(value).property("nested","value1").evaluate(function() { return this.require() }).threw.type(TypeError);
					verify(one).nested.method().is("method");
				})();
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace error {
		export namespace old {
			export type Instance<N extends string, P extends {}> = {
				name: N
				message: string
				stack?: string
			} & P

			export type Type<N extends string, P extends {}> = {
				new (message?: string, properties?: P): Instance<N,P>
				(message?: string, properties?: P): Instance<N,P>
				readonly prototype: Instance<N,P>
			}
		}

		export interface Custom<N extends string,P extends {}> extends Error {
			properties: P
		}

		export type CustomType<N extends string,P extends {}> = {
			new (p?: P): Custom<N,P>;
			(p?: P): Custom<N,P>;
			readonly prototype: Custom<N,P>;
		}
	}

	export interface Global {
		Error: {
			/**
			 * Deprecated APIs for dealing with custom error types.
			 *
			 * @deprecated
			 */
			old: {
				/**
				 * Creates a subtype of the JavaScript global constructor {@link Error} for use in APIs.
				 *
				 * @deprecated Replaced by {@link Global | Global]"Error"]["type"]}.
				 */
				Type: <N extends string, P extends {}>(p: {
					/**
					 * The `name` property to use for errors of this type; see the ECMA-262 {@link https://262.ecma-international.org/11.0/#sec-error.prototype.name | error.prototype.name} definition.
					 */
					name: N
					/**
					 * An {@link Error} subtype to use as the supertype for errors created by this constructor. Defaults to `Error`,
					 * but subtypes of other errors (like `TypeError`) can be created, as can subtypes of user-defined error types.
					 */
					extends?: ErrorConstructor
				}) => slime.$api.error.old.Type<N,P>

				/**
				 * Creates a subtype of the JavaScript global constructor {@link Error} for use in APIs.
				 *
				 * @deprecated Not necessary when using {@link Global | Global]"Error"]["type"]}; `instanceof` can be used.
				 */
				isType: <N extends string,P extends {}>(type: slime.$api.error.old.Type<N,P>) => (e: any) => e is slime.$api.error.old.Instance<N,P>
			}

			/**
			 * Creates a JavaScript error type. The error type can take an arbitrary object containing properties in its constructor;
			 * these properties are used to generate the error message via the `getMessage` provided when creating the type, and are
			 * available on error instances via the `properties` property.
			 */
			type: <N extends string,S extends () => Error,P extends {}>(p: {
				name: N
				extends?: S,
				getMessage: (p?: P) => string
			}) => error.CustomType<N,P>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.manual.Error = {
				//	Given that stack is non-standard, not adding this to suite and not really asserting on its format
				//	TODO	*is* stack still non-standard?
				stack: function() {
					var OldType = $api.Error.old.Type({
						name: "foo",
						extends: TypeError
					});

					try {
						throw new OldType("bar");
					} catch (e) {
						var error: Error = e;
						verify(error).stack.is.not(void(0));
					}

					var Type = $api.Error.type({
						name: "Foo",
						extends: TypeError,
						getMessage: function() {
							return "bar";
						}
					});

					try {
						throw new Type();
					} catch (e) {
						var error: Error = e;
						verify(e).stack.is.type("string");
						//	TODO	in jsh (at least under Rhino), this stack trace does not include the error's toString(); in Chrome, it
						//			does. Other platforms untested.
						if (fifty.global.jsh) fifty.global.jsh.shell.console(e.stack);
						if (fifty.global.window) fifty.global.window["console"].log(e.stack);
					}
				}
			};

			fifty.tests.exports.Error = function() {
				var CustomError = $api.Error.old.Type({
					name: "Custom"
				});

				var ParentError = $api.Error.old.Type({
					name: "Parent",
					extends: TypeError
				});

				var ChildError = $api.Error.old.Type({
					name: "Child",
					//	TODO	regression seemingly caused by TypeScript update to 4.7.3
					//@ts-ignore
					extends: ParentError
				});

				try {
					throw new CustomError("hey", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(true);
					verify($api.Error.old.isType(CustomError)(e)).is(true);
					verify(e instanceof ParentError).is(false);
					verify($api.Error.old.isType(ParentError)(e)).is(false);
					verify(e instanceof ChildError).is(false);
					verify($api.Error.old.isType(ChildError)(e)).is(false);
					verify(e instanceof TypeError).is(false);
					verify($api.Error.old.isType(TypeError)(e)).is(false);
					verify(Boolean(e.custom)).is(true);
					verify(String(e.message)).is("hey");
					verify(String(e.toString())).is("Custom: hey");
				}

				try {
					throw new ParentError("how", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(false);
					verify($api.Error.old.isType(CustomError)(e)).is(false);
					verify(e instanceof ParentError).is(true);
					verify($api.Error.old.isType(ParentError)(e)).is(true);
					verify(e instanceof ChildError).is(false);
					verify($api.Error.old.isType(ChildError)(e)).is(false);
					verify(e instanceof TypeError).is(true);
					verify($api.Error.old.isType(TypeError)(e)).is(true);
				}

				try {
					throw new ChildError("now", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(false);
					verify($api.Error.old.isType(CustomError)(e)).is(false);
					verify(e instanceof ParentError).is(true);
					verify($api.Error.old.isType(ParentError)(e)).is(true);
					verify(e instanceof ChildError).is(true);
					verify($api.Error.old.isType(ChildError)(e)).is(true);
					verify(e instanceof TypeError).is(true);
					verify($api.Error.old.isType(TypeError)(e)).is(true);
				}

				fifty.run(fifty.tests.exports.Error.type);
			}

			fifty.tests.exports.Error.type = function() {
				var Parent = $api.Error.type({
					name: "Foo",
					extends: TypeError,
					getMessage: function(p: { foo: string, bar: number }): string {
						return (p) ? "baz: foo=" + p.foo + " bar=" + p.bar : "baz: no p";
					}
				});

				var e = new Parent({ foo: "foo", bar: 8 });

				var Child = $api.Error.type({
					name: "Bar",
					extends: Parent,
					getMessage: function(p: { baz: string }): string {
						return "hey, it is " + p.baz;
					}
				});

				verify(e).message.is("baz: foo=foo bar=8");
				verify(e).evaluate(String).is("Foo: baz: foo=foo bar=8");
				verify(e).evaluate(function(e) { return e instanceof Parent }).is(true);
				verify(e).evaluate(function(e) { return e instanceof TypeError }).is(true);
				verify(e).evaluate(function(e) { return e instanceof EvalError }).is(false);
				verify(e).evaluate(function(e) { return e instanceof Error }).is(true);
				verify(e).properties.foo.is("foo");
				verify(e).properties.bar.is(8);

				var c = new Child({ baz: "bizzy" });
				verify(c).message.is("hey, it is bizzy");
				verify(c).evaluate(String).is("Bar: hey, it is bizzy");
				verify(c).evaluate(function(e) { return e instanceof Child }).is(true);
				verify(c).evaluate(function(e) { return e instanceof Parent }).is(true);
				verify(c).evaluate(function(e) { return e instanceof TypeError }).is(true);
				verify(c).evaluate(function(e) { return e instanceof EvalError }).is(false);
				verify(c).evaluate(function(e) { return e instanceof Error }).is(true);
				verify(c).properties.baz.is("bizzy");
				verify(c).properties.evaluate.property("foo").is.type("undefined");
				verify(c).evaluate.property("stack").is.type("string");

				var NoSupertype = $api.Error.type({
					name: "Standalone",
					getMessage: function(p: {}): string {
						return "foo";
					}
				});
				var n = new NoSupertype();
				verify(n).is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Global {
		TODO: (p?: { message: slime.$api.fp.Thunk<string> }) => Function
	}

	export interface Global {
		events: exports.Events

		/**
		 * All parts of this property are **deprecated**. See the individual declarations for details.
		 *
		 * @deprecated Replaced by {@link slime.$api.Global["events"] }
		 */
		Events: {
			/** @deprecated Replaced by {@link slime.$api.Global["events"]["create"]} */
			(p?: {
				source?: any
				parent?: slime.$api.event.Emitter<any>
				getParent?: () => slime.$api.event.Emitter<any>
				on?: { [x: string]: any }
			}): slime.$api.event.Emitter<any>

			/** @deprecated Replaced by {@link slime.$api.Global["events"]["Function"]} */
			Function: $api.Global["events"]["Function"]
		}
	}

	export namespace threads {
		export interface StepRunEvents {
			unready: void
		}

		export interface Step {
			ready: () => boolean
			run: () => void
		};
	}

	export interface Global {
		threads: {
			steps: {
				run: (
					a: { steps: threads.Step[] },
					receiver?: slime.$api.event.Function.Receiver<{
						unready: threads.Step
					}>
				) => {
					/**
					 * A set of steps that never executed because they were never `ready()`.
					 */
					unready: threads.Step[]
				}

				Task: any
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi._1 = function() {
				var emitter = api.Events();

				var called = false;

				emitter.listeners.add("aType", function() {
					var self: event.Emitter<any> = this;
					verify(self).is(emitter);
					called = true;
				});

				emitter.fire("aType");
				verify(called).is(true);
			};

			fifty.tests.jsapi._2 = function() {
				var parent = {};
				var child = {};
				var emitters = {
					parent: api.Events({ source: parent }),
					child: void(0)
				};
				emitters.child = api.Events({ source: child, parent: emitters.parent });

				var called = {
					parent: false,
					child: false
				};

				emitters.parent.listeners.add("aType", function(e) {
					//@ts-ignore
					verify(this).is(parent);
					//@ts-ignore
					verify(e).source.is(child);
					called.parent = true;
				});

				emitters.child.listeners.add("aType", function(e) {
					//@ts-ignore
					verify(this).is(child);
					//@ts-ignore
					verify(e).source.is(child);
					called.child = true;
				});

				emitters.child.fire("aType");
				verify(called).parent.is(true);
				verify(called).child.is(true);
			};

			fifty.tests.jsapi._3 = function() {
				var source = new function() {
					var events = api.Events({ source: this });

					this.listeners = {
						add: function(type,handler) {
							events.listeners.add(type,handler);
						},
						remove: function(type,handler) {
							events.listeners.remove(type,handler);
						}
					}

					this.doIt = function(p) {
						events.fire("done", p);
					};
				};

				var received: Event<any>[] = [];
				var counter = function(e: Event<any>) {
					received.push(e);
				};

				const asSource = function(p: any): typeof source {
					return p as typeof source;
				}

				verify(received).length.is(0);
				source.doIt();
				verify(received).length.is(0);
				source.listeners.add("other", counter);
				verify(received).length.is(0);
				source.doIt();
				verify(received).length.is(0);
				source.listeners.add("done", counter);
				source.doIt();
				verify(received).length.is(1);
				const asObject = function(p: any) { return p as object; }
				verify(received)[0].source.evaluate(asObject).is(source);
				source.listeners.remove("done", counter);
				source.doIt();
				verify(received).length.is(1);
			}

			fifty.tests.jsapi._4 = function() {
				verify(api,"$api").threads.steps.is.not.equalTo(null);
				verify(api,"$api").threads.steps.evaluate.property("run").is.not.equalTo(null);

				var $steps = verify(api.threads.steps,"$api.threads.steps");
				var $run = $steps.evaluate(function() { return this.run({ steps: [] }) });
				$run.threw.nothing();

				var A = function(shared) {
					this.ready = function() {
						return true;
					}

					this.run = function() {
						shared.a = true;
					}
				};

				var B = function(shared) {
					this.ready = function() {
						return shared.a;
					};

					this.run = function() {
						shared.b = true;
					}
				}

				type Shared = { a: boolean, b: boolean }

				var Shared = function() {
					this.a = false;
					this.b = false;
				};

				var Listener = function() {
					var unready = [];

					this.on = {
						unready: function(e) {
							unready.push(e.detail);
						}
					}

					this.unready = unready;
				}

				var s1: Shared = new Shared();
				$steps.run({
					steps: [ new A(s1) ]
				});
				verify(s1).a.is(true);

				var s2: Shared = new Shared();
				$steps.run({
					steps: [ new B(s2), new A(s2) ]
				});
				verify(s2).a.is(true);
				verify(s2).b.is(true);

				var s3: Shared = new Shared();
				var b3 = new B(s3);
				var l3: { on: any, unready: any[] } = new Listener();
				verify(api).threads.steps.run({
					steps: [ b3 ]
				}, l3.on).unready.length.is(1);
				verify(s3).a.is(false);
				verify(s3).b.is(false);
				verify(l3).unready.length.is(1);
				const asObject = function(p: any) { return p as object; }
				verify(l3).unready[0].evaluate(asObject).is(b3);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit,
		) {
			fifty.tests.suite = function() {
				fifty.load("$api-flag.fifty.ts");
				fifty.load("$api-mime.fifty.ts");
				fifty.load("$api-Function.fifty.ts");
				fifty.load("$api-Function_old.fifty.ts");
				fifty.load("$api-fp-methods.fifty.ts");

				fifty.run(fifty.tests.jsapi);
				fifty.run(fifty.tests.exports);
			}

			fifty.test.platforms();
		}
	//@ts-ignore
	)(fifty)
}

namespace slime.$api.internal {
	export type script = <C,E>(name: string) => slime.loader.Script<C,E>
}

namespace slime.$api.oo {
	export type Modifier<T extends object> = (t: T) => void
}
