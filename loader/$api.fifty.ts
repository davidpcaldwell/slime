//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

interface Function {
	construct: any
}

namespace slime.$api {
	(
		function(fifty: slime.fifty.test.Kit) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Global {
		debug: {
			disableBreakOnExceptionsFor: <T extends slime.external.lib.es5.Function>(f: T) => T
		}

		Filter: {
			/**
			 * @deprecated Use {@link slime.$api.Global["filter"]["and"]}. }
			 */
			and: slime.$api.fp.Exports["Predicate"]["and"]

			/**
			 * @deprecated Use {@link slime.$api.Global["filter"]["or"]}. }
			 */
			or: slime.$api.fp.Exports["Predicate"]["or"]
		}

		Constructor: any

		Key: any
	}

	export interface Global {
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
				 * If `G` is not <code>string</code>, converts `G`s to and from `string`.
				 */
				codec?: {
					encode: (group: G) => string,
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

			match<L,R> (
				p: {
					left: L[],
					right: R[],
					matches: (l: L, r: R) => boolean,
					unmatched?: {
						left?: (l: L) => void,
						right?: (r: R) => void
					},
					matched?: (p: {
						left: L,
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
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Global {
		Properties: any

		Object: {
			(p: { properties: {name: string, value: any }[] }): { [x: string]: any }
			compose: {
				<T>(t: T): T
				<T,U>(t: T, u: U): T & U
				<T,U,V>(t: T, u: U, v: V): T & U & V
				<T,U,V,W>(t: T, u: U, v: V, w: W): T & U & V & W
			}
			properties: slime.external.lib.es5.Function
			property: any
			optional: any
			values: {
				/**
				 * @experimental Completely untested.
				 */
				map: <O,T,R>(f: (t: T) => R) => (o: { [x in keyof O]: T } ) => { [x in keyof O]: R }
			}
		}

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

	export namespace error {
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

	export interface Global {
		Error: {
			/**
			 * Creates a subtype of the JavaScript global constructor {@link Error} for use in APIs.
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
			}) => slime.$api.error.Type<N,P>

			isType: <N extends string,P extends {}>(type: slime.$api.error.Type<N,P>) => (e: any) => e is slime.$api.error.Instance<N,P>
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
					var Type = $api.Error.Type({
						name: "foo",
						extends: TypeError
					});

					try {
						throw new Type("bar");
					} catch (e) {
						var error: Error = e;
						verify(error).stack.is.not(void(0));
					}
				}
			};

			fifty.tests.exports.Error = function() {
				var CustomError = $api.Error.Type({
					name: "Custom"
				});

				var ParentError = $api.Error.Type({
					name: "Parent",
					extends: TypeError
				});

				var ChildError = $api.Error.Type({
					name: "Child",
					//	TODO	regression seemingly caused by TypeScript update to 4.7.3
					//@ts-ignore
					extends: ParentError
				});

				try {
					throw new CustomError("hey", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(true);
					verify($api.Error.isType(CustomError)(e)).is(true);
					verify(e instanceof ParentError).is(false);
					verify($api.Error.isType(ParentError)(e)).is(false);
					verify(e instanceof ChildError).is(false);
					verify($api.Error.isType(ChildError)(e)).is(false);
					verify(e instanceof TypeError).is(false);
					verify($api.Error.isType(TypeError)(e)).is(false);
					verify(Boolean(e.custom)).is(true);
					verify(String(e.message)).is("hey");
					verify(String(e.toString())).is("Custom: hey");
				}

				try {
					throw new ParentError("how", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(false);
					verify($api.Error.isType(CustomError)(e)).is(false);
					verify(e instanceof ParentError).is(true);
					verify($api.Error.isType(ParentError)(e)).is(true);
					verify(e instanceof ChildError).is(false);
					verify($api.Error.isType(ChildError)(e)).is(false);
					verify(e instanceof TypeError).is(true);
					verify($api.Error.isType(TypeError)(e)).is(true);
				}

				try {
					throw new ChildError("now", { custom: true });
				} catch (e) {
					verify(e instanceof CustomError).is(false);
					verify($api.Error.isType(CustomError)(e)).is(false);
					verify(e instanceof ParentError).is(true);
					verify($api.Error.isType(ParentError)(e)).is(true);
					verify(e instanceof ChildError).is(true);
					verify($api.Error.isType(ChildError)(e)).is(true);
					verify(e instanceof TypeError).is(true);
					verify($api.Error.isType(TypeError)(e)).is(true);
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace events {
		/**
		 * An object whose methods process events; events of a type are mapped to a method with the same name as that type.
		 */
		export type Handler<D> = {
			[k in keyof D]?: event.Handler<D[k]>
		}
	}

	export namespace events.Function {
		//	TODO	it appears this duplicates the events.Handler concept above
		export type Receiver = { [x: string]: (e: Event<any>) => void } | Events<any>
	}

	export interface Global {
		events: {
			create: (p?: {
				source?: any
				parent?: slime.$api.Events<any>
				getParent?: () => slime.$api.Events<any>
				on?: { [x: string]: any }
			}) => slime.$api.Events<any>

			//	TODO	could probably use parameterized types to improve accuracy
			Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: slime.$api.events.Function.Receiver) => R

			toHandler: <D>(handler: slime.$api.events.Handler<D>) => {
				emitter: slime.$api.Events<D>
				attach: () => void
				detach: () => void
			}

			action: <E,R>(f: ( events: slime.$api.Events<E> ) => R) => (handler: slime.$api.events.Handler<E>) => R
		}
		/** @deprecated Replaced by {@link slime.$api.Global["events"] } */
		Events: {
			/** @deprecated Replaced by {@link slime.$api.Global["events"]["create"]} */
			(p?: {
				source?: any
				parent?: slime.$api.Events<any>
				getParent?: () => slime.$api.Events<any>
				on?: { [x: string]: any }
			}): slime.$api.Events<any>

			/** @deprecated Replaced by {@link slime.$api.Global["events"]["Function"]} */
			Function: $api.Global["events"]["Function"]
			/** @deprecated Replaced by {@link slime.$api.Global["events"]["toHandler"]} */
			toHandler: $api.Global["events"]["toHandler"]
			/** @deprecated Replaced by {@link slime.$api.Global["events"]["action"]} */
			action: $api.Global["events"]["action"]
		}
	}

	export interface Global {
		threads: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit,
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty)
}

namespace slime.$api.internal {
	export type script = <C,E>(name: string) => slime.loader.Script<C,E>
}
