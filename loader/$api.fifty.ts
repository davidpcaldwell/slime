interface Function {
	construct: any
}

type Iterable_match<L,R> = {
	left: L,
	right: R
}

interface $api {
	debug: {
		disableBreakOnExceptionsFor: <T extends Function>(f: T) => T
	}
	Object: {
		(p: { properties: {name: string, value: any }[] }): { [x: string]: any }
		compose: {
			<T>(t: T): T
			<T,U>(t: T, u: U): T & U
			<T,U,V>(t: T, u: U, v: V): T & U & V
			<T,U,V,W>(t: T, u: U, v: V, w: W): T & U & V & W
		}
		properties: Function
		property: any
		optional: any
	},
	Value: any,
	Error: {
		Type: <T extends Error>(p: { name: string, extends?: Function }) => $api.Error.Type<T>
	}
	Events: {
		(p?: {
			source?: any
			parent?: $api.Events
			getParent?: () => $api.Events
			on?: { [x: string]: any }
		}): $api.Events

		//	TODO	could probably use parameterized types to improve accuracy
		Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: $api.Events.Function.Receiver) => R,
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
	deprecate: {
		(o: object, property: string): void
		<T extends Function>(f: T): T
		warning: any
	}
	experimental: {
		(o: object, property: string): void
		<T extends Function>(f: T): T
	}
}

declare namespace $api {
	const debug: $api["debug"];
	const Iterable: $api["Iterable"];
	const Events : $api["Events"];
	const Value: $api["Value"]

	interface Event<T> {
		type: string
		source: object
		timestamp: number
		detail: T
		path: any[]
	}

	namespace Event {
		type Handler<T> = (e: Event<T>) => void
	}

	interface Events {
		listeners: {
			add: (type: string, handler: Event.Handler<any>) => void
			remove: (type: string, handler: Event.Handler<any>) => void
		},
		fire: (type: string, detail: any) => void
	}

	namespace Events {
		type Handler<D> = {
			[k in keyof D]?: Event.Handler<D[k]>
		}
	}

	namespace Events.Function {
		type Receiver = { [x: string]: (e: Event<any>) => void } | $api.Events
	}

	namespace Error {
		type Type<T extends Error> = new (message: string, properties?: object) => T
	}

	const deprecate: $api["deprecate"];
	const experimental: $api["experimental"];

	const Function: Function;
	const Object: $api["Object"];

	namespace internal {
		interface $slime {
			getRuntimeScript(path: string): any
		}

		interface $platform {
            execute: (code: { name?: string, js: string }, scope: { [x: string]: any }, target: any) => any
            Error: {
                decorate?: <T>(errorConstructor: T) => T
            }
		}
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
		$api: $api
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
