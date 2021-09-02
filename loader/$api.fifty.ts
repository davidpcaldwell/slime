//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

interface Function {
	construct: any
}

type Iterable_match<L,R> = {
	left: L,
	right: R
}


/**
 * A namespace that aliases global types so that they can be shadowed by namespaced type definitions and still be available within
 * those namespaces.
 */
namespace slime.alias {
	//	TODO	probably should reference these as slime.global.Function
	export type GlobalFunction = Function
}

namespace slime.$api {
	export interface Global {
		debug: {
			disableBreakOnExceptionsFor: <T extends slime.alias.GlobalFunction>(f: T) => T
		}
		Object: {
			(p: { properties: {name: string, value: any }[] }): { [x: string]: any }
			compose: {
				<T>(t: T): T
				<T,U>(t: T, u: U): T & U
				<T,U,V>(t: T, u: U, v: V): T & U & V
				<T,U,V,W>(t: T, u: U, v: V, w: W): T & U & V & W
			}
			properties: slime.alias.GlobalFunction
			property: any
			optional: any
		},
		Value: any,
		Events: {
			(p?: {
				source?: any
				parent?: slime.$api.Events<any>
				getParent?: () => slime.$api.Events<any>
				on?: { [x: string]: any }
			}): slime.$api.Events<any>

			//	TODO	could probably use parameterized types to improve accuracy
			Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: slime.$api.events.Function.Receiver) => R

			toHandler: <E>(handler: slime.$api.events.Handler<E>) => {
				emitter: slime.$api.Events<E>
				attach: () => void
				detach: () => void
			}

			action: <E,R>(f: ( events: slime.$api.Events<E> ) => R) => (handler: slime.$api.events.Handler<E>) => R
		},
		Array: {
			/**
			 * Creates an array by creating an empty array and passing it to the given function to populate.
			 */
			build: <T>(f: (p: T[]) => void) => T[]
		}
		deprecate: {
			(o: object, property: string): void
			<T extends slime.alias.GlobalFunction>(f: T): T
			warning: any
		}
		experimental: {
			(o: object, property: string): void
			<T extends slime.alias.GlobalFunction>(f: T): T
		}
		debugger: any
		Filter: {
			/**
			 * @deprecated Use {@link slime.$api.Global["filter"]["and"]}. }
			 */
			and: $api.fp.Exports["filter"]["and"]
			/**
			 * @deprecated Use {@link slime.$api.Global["filter"]["or"]}. }
			 */
			or: $api.fp.Exports["filter"]["or"]
			/**
			 * @deprecated Use {@link slime.$api.Global["filter"]["not"]}. }
			 */
			not: $api.fp.Exports["filter"]["not"]
			property: {
				is: any
				equals: any
			}
		}
		Map: any
		Reduce: any
		Method: any
		Constructor: any
		Key: any
		Properties: any
		threads: any
	}

	/**
	 * An occurrence in which other parts of a program might be interested. Events have a
	 */
	export interface Event<T> {
		type: string
		source: object
		timestamp: number
		detail: T
		path: any[]
	}

	export namespace event {
		/**
		 * A function that receives events.
		 */
		export type Handler<T> = (e: Event<T>) => void
	}

	export interface Events<D> {
		listeners: {
			add: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void
			remove: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void
		},
		fire: <K extends keyof D>(type: K, detail?: D[K]) => void
	}

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
}

(
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.exports = {};
	}
//@ts-ignore
)(fifty);

namespace slime.$api {
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
					unmatched: {
						left: (l: L) => void,
						right: (r: R) => void
					},
					matched: (l: L, r: R) => void
				}
			): {
				unmatched: {
					left: L[],
					right: R[]
				},
				matched: Iterable_match<L,R>[]
			}
		}
	}
}


(
	function(
		$api: slime.$api.Global,
		fifty: slime.fifty.test.kit
	) {
		var verify = fifty.verify;

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
)($api,fifty);


namespace slime.$api {
	export interface Global {
		Error: {
			/**
			 * Creates a subtype of the JavaScript global constructor {@link Error} for use in APIs.
			 */
			Type: <T extends Error>(p: {
				/**
				 * The `name` property to use for errors of this type; see the ECMA-262 {@link https://262.ecma-international.org/11.0/#sec-error.prototype.name | error.prototype.name} definition.
				 */
				name: string
				/**
				 * An {@link Error} subtype to use as the supertype for errors created by this constructor. Defaults to `Error`,
				 * but subtypes of other errors (like `TypeError`) can be created, as can subtypes of user-defined error types.
				 */
				extends?: new (message: string) => Error
			}) => slime.$api.Error.Type<T>
		}
	}

	export namespace Error {
		export type Type<T extends Error> = new (message: string, properties?: object) => T
	}
}


(
	function(
		fifty: slime.fifty.test.kit,
		$api: slime.$api.Global
	) {
		var verify = fifty.verify;

		fifty.tests.exports.Error = function() {
			var Type = $api.Error.Type({
				name: "foo",
				extends: TypeError
			});

			try {
				throw new Type("bar");
			} catch (e) {
				//	Given that stack is non-standard, not adding this to suite and not really asserting on its format
				var error: Error = e;
				verify(error).stack.is.not(void(0));
			}
		};

		fifty.tests.Error = function() {
			var CustomError = $api.Error.Type({
				name: "Custom"
			});

			var ParentError = $api.Error.Type({
				name: "Parent",
				extends: TypeError
			});

			var ChildError = $api.Error.Type({
				name: "Child",
				extends: ParentError
			});

			try {
				throw new CustomError("hey", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(true);
				verify(e instanceof ParentError).is(false);
				verify(e instanceof ChildError).is(false);
				verify(e instanceof TypeError).is(false);
				verify(Boolean(e.custom)).is(true);
				verify(String(e.message)).is("hey");
				verify(String(e.toString())).is("Custom: hey");
			}

			try {
				throw new ParentError("how", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(false);
				verify(e instanceof ParentError).is(true);
				verify(e instanceof ChildError).is(false);
				verify(e instanceof TypeError).is(true);
			}

			try {
				throw new ChildError("now", { custom: true });
			} catch (e) {
				verify(e instanceof CustomError).is(false);
				verify(e instanceof ParentError).is(true);
				verify(e instanceof ChildError).is(true);
				verify(e instanceof TypeError).is(true);
			}
		}
	}
//@ts-ignore
)(fifty, $api);

(
	function(
		fifty: slime.fifty.test.kit,
	) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.exports.Iterable);
			fifty.run(fifty.tests.Error);
		}
	}
//@ts-ignore
)(fifty)
