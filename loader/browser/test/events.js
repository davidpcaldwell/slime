//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.loader.Export<any> } $export
	 */
	function($export) {
		var it = new function() {
			var Event = function(name,canBubble,cancelable) {
				this.name = name;
				this.bubbles = canBubble;
				this.canBubble = canBubble;
				this.cancelable = cancelable;

				this.set = function(p) {
					if (!p) return;
					for (var x in p) {
						this[x] = p[x];
					}
				}

				this.create = function() {
					var rv = document.createEvent("Event");
					var v = this;
					rv.initEvent(v.name,v.canBubble,v.cancelable);
					return rv;
				}
			}

			var UIEvent = function(name,canBubble,cancelable) {
				Event.call(this,name,canBubble,cancelable);
				this.view = window;
				this.detail = null;
			}

			var MouseEvent = function(name,canBubble,cancelable) {
				this.name = void(0);
				this.canBubble = void(0);
				this.cancelable = void(0);
				this.view = void(0);
				this.detail = void(0);
				UIEvent.call(this,name,canBubble,cancelable)
				this.screenX = 0;
				this.screenY = 0;
				this.clientX = 0;
				this.clientY = 0;
				this.ctrlKey = false;
				this.altKey = false;
				this.shiftKey = false;
				this.metaKey = false;
				this.button = 0;
				this.relatedTarget = null;

				this.set = function(p) {
					if (!p) return;
					for (var x in p) {
						this[x] = p[x];
					}
				}

				this.create = function() {
					if (document.createEvent) {
						var rv = document.createEvent("MouseEvent");
						var v = this;
						rv.initMouseEvent(
							v.name,v.canBubble,v.cancelable,v.view,v.detail,v.screenX,v.screenY,v.clientX,v.clientY,v.ctrlKey,v.altKey,
							v.shiftKey,v.metaKey,v.button,v.relatedTarget
						);
						return rv;
					} else {
						/** @type { MouseEvent } */
						var rv = document["createEventObject"]();
						if (false) {
							for (var x in this) {
								if (typeof(x) != "function") {
									//@ts-ignore
									rv[x] = this[x];
								}
							}
						}
						return rv;
					}
				}
			}

			var KeyEvent = function(name,canBubble,cancelable) {
				this.set = void(0);
				UIEvent.call(this,name,canBubble,cancelable);
				this["char"] = null;
				this.key = null;
				this.location = 0;
				this.ctrlKey = false;
				this.altKey = false;
				this.shiftKey = false;
				this.metaKey = false;
				this.repeat = false;
				this.locale = null;

				this.create = function() {
					if (document.createEvent) {
						var rv = new KeyboardEvent(name,this);
						// var modifiers = [];
						// if (this.ctrlKey) modifiers.push("Control");
						// if (this.altKey) modifiers.push("Alt");
						// if (this.shiftKey) modifiers.push("Shift");
						// if (this.metaKey) modifiers.push("Meta");
						// rv.initKeyboardEvent(
						// 	v.name,v.canBubble,v.cancelable,v.view,v["char"],v.key,v.location,modifiers.join(" "),v.repeat,v.locale
						// );
						return rv;
					} else {
						throw new Error("Unimplemented: browser lacks createEvent for KeyboardEvent");
					}
				}
			};

			var eventFunction = function(name,constructor,properties) {
				return function(element,p) {
					if (!element) throw new Error("Cannot dispatch " + name + " because specified element is " + element);
					if (element.disabled) debugger;
					var v = new constructor(name, properties.bubbles, properties.cancelable);
					for (var x in properties) {
						v[x] = properties[x];
					}
					v.set(p);
					if (element.dispatchEvent) {
						element.dispatchEvent(v.create());
					} else if (element.fireEvent) {
						element.fireEvent("on" + name, v.create());
					}
				}
			};

			this.click = eventFunction("click",MouseEvent,{
				bubbles: true,
				cancelable: true,
				//	TODO	should detail be 1?
				detail: 1
			});

			this.mousedown = function(element,p) {
				if (element.disabled) debugger;
				var v = new MouseEvent("mousedown", true, true);
				v.detail = 0;
				v.set(p);
				element.dispatchEvent(v.create());
			}

			this.mouseup = function(element,p) {
				if (element.disabled) debugger;
				var v = new MouseEvent("mouseup", true, true);
				v.detail = 0;
				v.set(p);
				element.dispatchEvent(v.create());
			}

			this.change = function(element,p) {
				if (element.disabled) debugger;
				var v = new Event("change", true, false);
				v.set(p);
				element.dispatchEvent(v.create());
			};

			this.input = function(element,p) {
				if (element.disabled) debugger;
				var v = new Event("input", true, false);
				v.set(p);
				element.dispatchEvent(v.create());
			}

			this.keydown = function(element,p) {
				if (element.disabled) debugger;
				var v = new KeyEvent("keydown",true,true);
				v.set(p);
				element.dispatchEvent(v.create());
			};

			this.keypress = function(element,p) {
				if (element.disabled) debugger;
				var v = new KeyEvent("keypress",true,true);
				v.set(p);
				element.dispatchEvent(v.create());
			};

			this.keyup = function(element,p) {
				if (element.disabled) debugger;
				var v = new KeyEvent("keyup",true,true);
				v.set(p);
				element.dispatchEvent(v.create());
			};

			this.focus = function(element,p) {
				if (element.disabled) debugger;
				// TODO: no support for Internet Explorer here
				element.dispatchEvent(new FocusEvent("focus", p));
			}

			this.blur = function(element,p) {
				if (element.disabled) debugger;
				// TODO: no support for Internet Explorer here
				element.dispatchEvent(new FocusEvent("blur", p));
			}

			this.focusin = function(element,p) {
				if (element.disabled) debugger;
				// TODO: no support for Internet Explorer here
				element.dispatchEvent(new FocusEvent("focusin", p));
			}

			this.focusout = function(element,p) {
				if (element.disabled) debugger;
				// TODO: no support for Internet Explorer here
				element.dispatchEvent(new FocusEvent("focusout", p));
			}
		};
		$export(it);
	}
//@ts-ignore
)($export);
