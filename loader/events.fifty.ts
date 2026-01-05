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
			implementation: (events: slime.$api.event.Emitter<E>) => T,
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

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.$api {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.types = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.types.Event = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	/**
	 * An occurrence in which other parts of a program might be interested, fired by an event source.
	 *
	 * Events have a string `type`; listeners can subscribe to all events of a given type for a given source.
	 *
	 * They also contain a reference to their source, which can be any value that makes sense to the application, and is specified
	 * when creating an object-oriented event emitter ({@link $api.event.Emitter}).
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
		/** An event _type_. Event sources may define arbitrary types. */
		type: string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.types.Event.type = function() {
				var events: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter();

				var event: Event<any>;

				events.listeners.add("aType", function(e) {
					event = e;
				});

				events.fire("aType");

				verify(event).type.is("aType");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Event<T> {
		//	TODO	is this always object?
		/**
		 * An event *source* . This object may be the `Events` itself, or an arbitrary object specified as the logical event source.
		 */
		source: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.types.Event.source = function() {
				fifty.run(function one() {
					var events: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter();

					var event;

					events.listeners.add("aType", function(e) {
						event = e;
					});

					events.fire("aType");

					verify(event).evaluate.property("source").is(events);
				});

				fifty.run(function two() {
					var parent = $api.Events();
					var child = $api.Events({ parent: parent });

					var last: slime.$api.Event<any>;

					parent.listeners.add("aType", function(e) {
						last = e;
					});

					parent.fire("aType");
					verify(last).evaluate.property("source").is(parent);
					child.fire("aType");
					verify(last).evaluate.property("source").is(child);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Event<T> {
		/**
		 * When accessed in an event handler, this array of emitters will be set to the current *path* in the `Events` hierarchy from
		 * which this event was fired.
		 */
		path: any[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.types.Event.path = function() {
				var parent: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter();
				var child = $api.events.emitter({ parent: parent });

				type Received = { source: object, path: object[] };

				var received: { parent: Received, child: Received } = {
					parent: void(0),
					child: void(0)
				};

				var receive = function(name) {
					return function(e) {
						received[name] = { source: e.source, path: e.path.slice() };
					};
				};

				parent.listeners.add("aType", receive("parent"));
				child.listeners.add("aType", receive("child"));

				child.fire("aType");

				verify(received).parent.path.length.is(1);
				verify(received).parent.path[0].is(child);
				verify(received).child.path.length.is(0);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Event<T> {
		/**
		 * The time at which the event was fired, in the same format as used by the `Date` constructor.
		 */
		timestamp: number
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.types.Event.timestamp = function() {
				//	TODO	mock Date to allow testing value below?

				var events: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter();

				var event;

				events.listeners.add("aType", function(e) {
					event = e;
				});

				events.fire("aType");

				verify(event).timestamp.is.type("number");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Event<T> {
		/**
		 * An optional, arbitrary, event-type-specific value attached to the event when it is fired containing additional
		 * information about the event.
		 */
		detail: T
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.types.Event.detail = function() {
				var events: slime.$api.event.Emitter<{ aType: any }> = $api.events.emitter();

				var received = [];

				events.listeners.add("aType", function(e) {
					received.push(e);
				});

				events.fire("aType");
				events.fire("aType", void(0));
				events.fire("aType", null);
				events.fire("aType", true);
				events.fire("aType", 2);
				events.fire("aType", "aString");
				events.fire("aType", { property: "value" });

				const asUnknown = function(p: any) { return p as unknown; }
				const asNull = function(p: any) { return p as object; }
				const asBoolean = function(p: any) { return p as boolean; }

				verify(received)[0].detail.evaluate(asUnknown).is(void(0));
				verify(received)[1].detail.evaluate(asUnknown).is(void(0));
				verify(received)[2].detail.evaluate(asNull).is(null);
				verify(received)[3].detail.evaluate(asBoolean).is(true);
				verify(received)[4].evaluate.property("detail").is(2);
				verify(received)[5].evaluate.property("detail").is("aString");
				verify(received)[6].evaluate.property("detail").property.is("value");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace event {
		export interface Producer<D> {
			/**
			 * Causes this object to fire an event to its listeners.
			 *
			 * @param type An event _type_.
			 * @param detail An event _detail_, which can be any type, and will be used as the `detail` property of the created
			 * event.
			 */
			fire: <K extends keyof D>(type: K, detail?: D[K]) => void
		}

		export interface Emitter<D> extends Producer<D> {
			listeners: {
				/**
				 * Adds an event listener that will be notified about a particular <dfn>type</dfn> of events.
				 *
				 * @param type An event _type_.
				 * @param handler A listener function that will be invoked when the event occurs.
				 */
				add: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void

				/**
				 * Removes an event listener.
				 *
				 * @param type An event _type_.
				 * @param handler A listener function.
				 */
				remove: <K extends keyof D>(type: K, handler: event.Handler<D[K]>) => void
			}
		}
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
			export type Receiver<D = object> = Handlers<D> | Emitter<D>
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
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.events = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.events.create = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Events {
			/**
			 * Creates an {@link slime.$api.event.Emitter} that can be used to fire events to a set of listeners. Event emitters can be
			 * arranged in a hierarchy.
			 *
			 * @param p
			 * @returns An {@link slime.$api.event.Emitter} configured using the given argument.
			 */
			emitter: <D>(p?:
				{
					/** (optional; default is the created {@link slime.$api.event.Emitter}) */
					source?: {}
					on?: slime.$api.event.Handlers<D>
				} & (
					{
						//	TODO	should turn this into mutually exclusive OR
						parent?: slime.$api.event.Emitter<D>
						getParent?: () => slime.$api.event.Emitter<D>
					}
				)
			) => slime.$api.event.Emitter<D>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.events.create.source = function() {
					var source = {};


					var noSource: slime.$api.event.Emitter<{ foo: void }> = $api.events.emitter();
					var withSource: slime.$api.event.Emitter<{ foo: void }> = $api.events.emitter({ source: source });

					var Captor = function() {
						var captured = [];
						var captor = function(e) {
							captured.push(e);
						}
						return {
							captured: captured,
							captor: captor
						};
					};

					var captorOne = Captor();
					var captorTwo = Captor();

					noSource.listeners.add("foo", captorOne.captor);
					withSource.listeners.add("foo", captorTwo.captor);

					noSource.fire("foo");
					withSource.fire("foo");

					verify(captorOne).captured.length.is(1);
					verify(captorOne).captured[0].evaluate.property("source").is(noSource);
					verify(captorTwo).captured.length.is(1);
					verify(captorTwo).captured[0].evaluate.property("source").is(source);
				};

				fifty.tests.exports.events.create.parent = function() {
					var parent: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter();
					var child: slime.$api.event.Emitter<{ aType: void }> = $api.events.emitter({ parent: parent });

					var received = {
						parent: [],
						child: []
					};

					var receive = function(name) {
						return function(e) {
							received[name].push({ source: e.source, path: e.path.slice() });
						};
					};

					parent.listeners.add("aType", receive("parent"));
					child.listeners.add("aType", receive("child"));

					parent.fire("aType");
					verify(received).parent.length.is(1);
					verify(received).child.length.is(0);

					child.fire("aType");
					verify(received).parent.length.is(2);
					verify(received).child.length.is(1);
				}

				fifty.tests.exports.events.create.jsapi = function() {
					var events = $api.events.emitter();
					verify(events).listeners.is.type("object");
					verify(events).listeners.evaluate.property("add").is.type("function");
					verify(events).listeners.evaluate.property("remove").is.type("function");
					verify(events).evaluate.property("fire").is.type("function");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Events {
			Function: <P,E,R>(f: (p: P, events: slime.$api.event.Emitter<E>) => R, defaultListeners?: slime.$api.event.Handlers<E>) => (argument: P, receiver?: slime.$api.event.Function.Receiver<E>) => R
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.Function = function() {
					var firesArgumentPropertyValues = function(p,events) {
						for (var x in p) {
							events.fire(x, p[x]);
						}
					};

					var Captor: () => slime.$api.event.Handlers<{ a: object, b: void }> & { got: slime.$api.Event<any>[] } = function() {
						var events: slime.$api.Event<any>[] = [];

						var received = function(e: slime.$api.Event<any>) {
							events.push(e);
						};

						return {
							a: received,
							b: received,
							got: events
						}
					};

					var onPropertyValues = $api.events.Function(firesArgumentPropertyValues);
					var on = Captor();
					onPropertyValues({}, on);
					verify(on,"on").got.length.is(0);

					var onA = Captor();
					onPropertyValues({ a: {} }, onA);
					verify(onA,"on").got.length.is(1);
					verify(onA,"on").got[0].type.is("a");

					var source = {};
					var events: slime.$api.event.Emitter<{ a: {}, b: void }> = $api.events.emitter({
						source: source
					});
					var payload = {};
					var received;
					events.listeners.add("a", function(e) {
						received = e;
					})
					onPropertyValues({ a: payload }, events);
					verify(received).is.type("object");
					verify(received).evaluate.property("detail").is(payload);
				}
			}
		//@ts-ignore
		)(fifty);

		declare const marker: unique symbol;

		/**
		 * An opaque type indicating that the given Events<D> can be detached from its handlers using the Handlers.detach()
		 * function.
		 */
		export type Attached<D> = slime.$api.event.Emitter<D> & { [marker]: true }

		export interface Events {
			Handlers: {
				/**
				 * Allows a caller to create an {@link slime.$api.event.Emitter} given a {@link slime.$api.event.Handlers} and independently
				 * manage the attachment of the `Handlers` to the event-emitting `Events` created. This can be useful in a
				 * multithreading or asynchronous situation where a listener that attaches at the beginning of a function and detaches
				 * at the end is not sufficient (because something created within the function outlives the function).
				 *
				 * @param handlers
				 * @returns
				 */
				attached: <D>(handlers: slime.$api.event.Handlers<D>) => Attached<D>

				/**
				 * Detaches a previously-created {@link slime.$api.event.Emitter} from the {@link slime.$api.event.Handlers} that was used
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.types);
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);
}
