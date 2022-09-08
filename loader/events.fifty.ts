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
}

namespace slime.runtime.internal.events {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	export interface Exports {
		api: slime.$api.Global["events"]

		ask: slime.$api.fp.Exports["world"]["old"]["ask"]
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
