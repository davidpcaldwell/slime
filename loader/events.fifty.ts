//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.internal.events {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	export interface Exports {
		/**
		 * Implements the `$api.events` API.
		 */
		exports: slime.$api.exports.Events

		/**
		 * Helper function, not exported to `$api`, which assists in implementing various wo constructs in `$api.fp.world`.
		 */
		handle: <E,T>(p: {
			implementation: (events: slime.$api.Events<E>) => T,
			handlers: slime.$api.event.Handlers<E>
		}) => T
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
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.$api {
	/**
	 * An occurrence in which other parts of a program might be interested.
	 *
	 * Events have a string `type`; listeners can subscribe to all events of a given type for a given source.
	 *
	 * They also contain a reference to their source, which can be any value that makes sense to the application, and is specified
	 * when creating an object-oriented event emitter.
	 *
	 * Event sources may be arranged in a hierarchy, and listeners may listen to any level of the hierarchy, in which case they will
	 * receive events emitted by descendants of the source to which they are listening. In this case, sources through which the
	 * event has previously passed will be contained in the `path` property.
	 *
	 * Events have a timestamp representing the time at which they occurred.
	 *
	 * An event may contain a `detail` property of an event-specific type; usually these types are constrained by the event type
	 * (the value of the `type` property).
	 */
	export interface Event<T> {
		type: string
		source: any
		path: any[]
		timestamp: number
		detail: T
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
			export type Receiver<D = object> = Handlers<D> | Events<D>
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
		export interface Events {
			create: <D>(p?:
				{
					source?: {}
					on?: slime.$api.event.Handlers<D>
				} & (
					{
						//	TODO	should turn this into mutually exclusive OR
						parent?: slime.$api.Events<D>
						getParent?: () => slime.$api.Events<D>
					}
				)
			) => slime.$api.Events<D>

			Function: <P,E,R>(f: (p: P, events: slime.$api.Events<E>) => R, defaultListeners?: slime.$api.event.Handlers<E>) => (argument: P, receiver?: slime.$api.event.Function.Receiver<E>) => R
		}

		declare const marker: unique symbol;

		/**
		 * An opaque type indicating that the given Events<D> can be detached from its handlers using the Handlers.detach()
		 * function.
		 */
		export type Attached<D> = slime.$api.Events<D> & { [marker]: true }

		export interface Events {
			Handlers: {
				/**
				 * Allows a caller to create an {@link slime.$api.Events} given a {@link slime.$api.event.Handlers} and independently
				 * manage the attachment of the `Handlers` to the event-emitting `Events` created. This can be useful in a
				 * multithreading or asynchronous situation where a listener that attaches at the beginning of a function and detaches
				 * at the end is not sufficient (because something created within the function outlives the function).
				 *
				 * @param handlers
				 * @returns
				 */
				attached: <D>(handlers: slime.$api.event.Handlers<D>) => Attached<D>

				/**
				 * Detaches a previously-created {@link slime.$api.Events} from the {@link slime.$api.event.Handlers} that was used
				 * to create it.
				 *
				 * @param events
				 * @returns
				 */
				detach: <D>(events: Attached<D>) => void
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				const subject: slime.runtime.internal.events.Exports = slime.runtime.internal.events.test.subject;

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

					var attached = subject.exports.Handlers.attached(handlers);

					attached.fire("a", 1);
					attached.fire("a", 2);

					verify(as.length).is(2);
					verify(as)[0].is(1);
					verify(as)[1].is(2);

					attached.fire("a", 3);
					verify(as.length).is(3);

					subject.exports.Handlers.detach(attached);
					attached.fire("a", 4);
					verify(as.length).is(3);
				}
			}
		//@ts-ignore
		)(fifty);
	}
}
