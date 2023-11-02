//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	//	TODO	finish the below comment!
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

	export namespace event {
		/**
		 * An object whose methods process events; events of a type are mapped to a method with the same name as that type.
		 */
		export type Handlers<D> = {
			[k in keyof D]?: event.Handler<D[k]>
		}

		export namespace Function {
			//	TODO	it appears this duplicates the event.Handlers concept above
			export type Receiver = { [x: string]: (e: Event<any>) => void } | Events<any>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Detachable<D> {
		}

		export interface AttachedHandlers<D> {
			emitter: slime.$api.Events<D>
			detachable: {
				detach: () => void
			}
		}

		export interface Events {
			create: (p?: {
				source?: any
				parent?: slime.$api.Events<any>
				getParent?: () => slime.$api.Events<any>
				on?: { [x: string]: any }
			}) => slime.$api.Events<any>

			//	TODO	could probably use parameterized types to improve accuracy
			Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: slime.$api.event.Function.Receiver) => R

			action: <E,R>(f: ( events: slime.$api.Events<E> ) => R) => (handler: slime.$api.event.Handlers<E>) => R

			invoke: <E,R>(f: (events: slime.$api.Events<E>) => R, handler: slime.$api.event.Handlers<E>) => R

			Handler: {
				attach: <T>(events: slime.$api.Events<T>) => (handler: slime.$api.event.Handlers<T>) => void
			}

			/**
			 * Allows a caller to create an {@link slime.$api.Events} given a {@link slime.$api.event.Handlers} and independently
			 * manage the attachment of the `Handlers` to the event-emitting `Events` created. This can be useful in a
			 * multithreading or asynchronous situation where a listener that attaches at the beginning of a function and detaches
			 * at the end is not sufficient (because something created within the function outlives the function).
			 *
			 * @param handler
			 * @returns
			 */
			toListener: <D>(handler: slime.$api.event.Handlers<D>) => {
				emitter: slime.$api.Events<D>
				attach: () => void
				detach: () => void
			}
		}

		declare const marker: unique symbol;

		/**
		 * An opaque type indicating that the given Events<D> can be detached from its handlers using the Handlers.detach()
		 * function.
		 */
		export type Attached<D> = slime.$api.Events<D> & { [marker]: true }

		export interface Events {
			Handlers: {
				attached: <D>(handlers: slime.$api.event.Handlers<D>) => Attached<D>
				detach: <D>(events: Attached<D>) => void
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

		ask: <E,T>(f: (events: slime.$api.Events<E>) => T) => (on?: slime.$api.event.Handlers<E>) => T
		tell: slime.$api.fp.Exports["world"]["old"]["tell"]
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var code: Script = fifty.$loader.script("events.js");
			var subject = code({
				deprecate: fifty.global.$api.deprecate
			});
			return subject;
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { subject } = test;

			var remembered;

			var as: number[] = [];

			fifty.tests.exports.Handlers = function() {
				type domain = {
					a: number
				}

				var handlers: slime.$api.event.Handlers<domain> = {
					a: function(e) {
						as.push(e.detail);
					}
				};

				var attached = subject.api.Handlers.attached(handlers);

				attached.fire("a", 1);
				attached.fire("a", 2);

				verify(as.length).is(2);
				verify(as)[0].is(1);
				verify(as)[1].is(2);

				attached.fire("a", 3);
				verify(as.length).is(3);

				subject.api.Handlers.detach(attached);
				attached.fire("a", 4);
				verify(as.length).is(3);
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);

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
