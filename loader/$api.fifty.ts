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
			Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: slime.$api.Events.Function.Receiver) => R,
			instance: (v: any) => boolean
		},
		Iterable: {
			/**
			 * Collates an iterable set of values of type V (extends any) into groups of type G (extends any) (or counts the number of
			 * values in each group) based on a specified set of criteria.
			 *
			 * @param p
			 */
			groupBy<V,G> (p: {
				array: Array<V>,
				group: (element: V) => G,
				groups?: Array<G>,
				codec?: {
					encode: (group: G) => string,
					decode: (string: string) => G
				},
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
		},
		Array: {
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
	}

	export interface Event<T> {
		type: string
		source: object
		timestamp: number
		detail: T
		path: any[]
	}

	export namespace Event {
		export type Handler<T> = (e: Event<T>) => void
	}

	export interface Events<D> {
		listeners: {
			add: <K extends keyof D>(type: K, handler: Event.Handler<D[K]>) => void
			remove: <K extends keyof D>(type: K, handler: Event.Handler<D[K]>) => void
		},
		fire: <K extends keyof D>(type: K, detail?: D[K]) => void
	}

	export namespace Events {
		export type Handler<D> = {
			[k in keyof D]?: Event.Handler<D[k]>
		}
	}

	export namespace Events.Function {
		export type Receiver = { [x: string]: (e: Event<any>) => void } | Events<any>
	}
}

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
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.exports = {};
	}
//@ts-ignore
)(fifty);

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
			run(fifty.tests.Error);
		}
	}
//@ts-ignore
)(fifty)
