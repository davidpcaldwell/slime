//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.events.Context } $context
	 * @param { slime.loader.Export<slime.runtime.internal.events.Exports> } $export
	 */
	function($context,$export) {
		/**
		 * @constructor
		 * @param { Parameters<slime.$api.exports.Events["emitter"]>[0] } [p]
		 */
		var Emitter = function(p) {
			if (!p) p = {};

			var source = (p.source) ? p.source : this;

			/** @returns { { bubble: (event: slime.$api.Event<any>) => void } } */
			var getParent = function() {
				/** @returns { { bubble: (event: slime.$api.Event<any>) => void } } */
				var castToInternal = function(events) {
					return events;
				}

				if (p.parent) return castToInternal(p.parent);
				if (p.getParent) return castToInternal(p.getParent());
			}

			/**
			 * @type { { [type: string]: slime.$api.event.Handler<any>[] } }
			 */
			var byType = {};

			/** @type { new (type: string, detail: any) => slime.$api.Event } */
			var Event = function(type,detail) {
				this.type = type;
				this.source = source;
				this.timestamp = Date.now();
				this.detail = detail;
				this.path = [];

				//	TODO	consider greater compatibility:
				//	http://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-interface
			};

			/**
			 * @type { slime.$api.event.Emitter<{ [name: string]: any }>["listeners"] }
			 */
			var listeners = {
				add: function(name,handler) {
					if (!byType[name]) {
						byType[name] = [];
					}
					byType[name].push(handler);
				},

				remove: function(name,handler) {
					if (byType[name]) {
						var index = byType[name].indexOf(handler);
						if (index != -1) {
							byType[name].splice(index,1);
						}
					}
				}
			};

			//	TODO	capability is undocumented. Document? Deprecate? Remove?
			for (var x in p.on) {
				listeners.add(x,p.on[x]);
			}

			this.listeners = listeners;

			/**
			 *
			 * @param { slime.$api.Event<any> } event
			 */
			function handle(event) {
				if (byType[event.type]) {
					byType[event.type].forEach(function(listener) {
						//	In a DOM-like structure, we would need something other than 'source' to act as 'this'
						listener.call(source,event)
					});
				}
				var parent = getParent();
				if (parent) {
					//	TODO	this appears to be a bug; would the path not consist of the source object several times in a row,
					//			once for each bubble? Possibly this should be event.path.unshift(this)? Should write test for path
					//			and see
					event.path.unshift(source);
					parent.bubble(event);
				}
			}

			//	Private method; used by children to send an event up the chain.
			Object.defineProperty(
				this,
				"bubble",
				{
					/**
					 *
					 * @param { slime.$api.Event<any> } event
					 */
					value: function(event) {
						handle(event);
					}
				}
			);

			this.fire = function(type,detail) {
				handle(new Event(type,detail));
			}
		};

		var attach = function(events,handler) {
			for (var x in handler) {
				events.listeners.add(x,handler[x]);
			}
		};

		var detach = function(events,handler) {
			for (var x in handler) {
				events.listeners.remove(x,handler[x]);
			}
		}

		/**
		 * @template { object } D
		 * @param { slime.$api.event.Handlers<D> } handlers
		 */
		var ListenersInvocationReceiver = function(handlers) {
			var source = {
				listeners: void(0)
			};
			var events = new Emitter({ source: source });

			return {
				attach: function() {
					attach(events,handlers);
				},
				detach: function() {
					detach(events,handlers);
				},
				emitter: events
			}
		};

		/** @type { slime.$api.exports.Events["Function"] } */
		var Function = function(f,defaultOn) {
			var EmitterInvocationReceiver = function(emitter) {
				this.attach = function(){};
				this.detach = function(){};
				this.emitter = emitter;
			}

			return function(p,receiver) {
				var invocationReceiver = (receiver instanceof Emitter)
					? new EmitterInvocationReceiver(receiver)
					: ListenersInvocationReceiver(
						(function() {
							if (receiver) return receiver;
							if (defaultOn) return defaultOn;
							return {};
						})()
					)
				;
				invocationReceiver.attach();
				try {
					return f.call( this, p, invocationReceiver.emitter );
				} finally {
					invocationReceiver.detach();
				}
			}
		};

		/** @type { ReturnType<ListenersInvocationReceiver>[] } */
		var attachedHandlers = [];

		$export({
			exports: {
				emitter: function(p) {
					return new Emitter(p);
				},
				Function: Function,
				Handlers: {
					/** @template { any } D */
					attached: function(handlers) {
						//	TODO	would be nice if we had access to $api.fp.cast, but would require refactor
						/** @type { (v: any) => slime.$api.exports.Attached<D> } */
						var cast = function(v) { return v; };

						var x = ListenersInvocationReceiver(handlers);
						x.attach();
						attachedHandlers.push(x);
						return cast(x.emitter);
					},
					detach: function(events) {
						var match;
						for (var i=0; i<attachedHandlers.length; i++) {
							if (attachedHandlers[i].emitter == events) {
								match = i;
							}
						}
						if (typeof(match) != "undefined") {
							attachedHandlers[match].detach();
							attachedHandlers.splice(match, 1);
						}
					}
				}
			},
			handle: function(p) {
				if (!p.implementation) throw new TypeError("Required: .implementation");
				var receiver = ListenersInvocationReceiver(p.handlers);
				receiver.attach();
				try {
					//	TODO	'this' is almost certainly wrong. Perhaps should be optional parameter?
					return p.implementation.call(this, receiver.emitter);
				} finally {
					receiver.detach();
				}
			}
		});
	}
//@ts-ignore
)($context,$export);
