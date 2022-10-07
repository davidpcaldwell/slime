//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
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

	export interface Events<D> {
		listeners: {
			add: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void
			remove: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void
		},
		fire: <K extends keyof D>(type: K, detail?: D[K]) => void
	}

	export namespace event {
		/**
		 * A function that receives events.
		 */
		export type Handler<T> = (e: Event<T>) => void
	}

	export namespace events {
		/**
		 * An object whose methods process events; events of a type are mapped to a method with the same name as that type.
		 */
		export type Handler<D> = {
			[k in keyof D]?: event.Handler<D[k]>
		}

		export namespace Function {
			//	TODO	it appears this duplicates the events.Handler concept above
			export type Receiver = { [x: string]: (e: Event<any>) => void } | Events<any>
		}
	}

	export namespace exports {
		export interface Events {
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

			invoke: <E,R>(f: (events: slime.$api.Events<E>) => R, handler: slime.$api.events.Handler<E>) => R

			Handler: {
				attach: <T>(events: slime.$api.Events<T>) => (handler: slime.$api.events.Handler<T>) => void
			}
		}
	}
}

namespace slime.runtime.internal.events {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	export interface Exports {
		api: slime.$api.exports.Events

		ask: <E,T>(f: (events: slime.$api.Events<E>) => T) => (on?: slime.$api.events.Handler<E>) => T
		tell: slime.$api.fp.Exports["world"]["old"]["tell"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			var code: Script = fifty.$loader.script("events.js");
			var subject = code({
				deprecate: fifty.global.$api.deprecate
			});

			var remembered;

			fifty.tests.suite = function() {
				var f = function(events) {
					remembered = events;
					events.fire("xxx", 2);
				};

				var captured = [];

				subject.api.invoke(f, {
					xxx: function(e) {
						captured.push(e);
					}
				});

				verify(captured).length.is(1);

				remembered.fire("xxx", 2);
				verify(captured).length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
