//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for web browsers.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$loader.run("initialize.js", { $api: $api });

var OldStep = function(o) {
	this.setup = function() {
		if (o.edits) {
			o.edits();
		}
	};

	this.run = function() {
		if (o.event) {
			o.event();
		}
	};

	this.async = o.wait || !o.event;

	this.check = function(scope) {
		if (o.tests) {
			o.tests(scope);
		}
//		scope.fail();
	};

	this.cleanup = function() {
		if (o.cleanup) {
			o.cleanup();
		} else if (o.undo) {
			$api.deprecate(function() {
				o.undo();
			})();
		}
	};
};

var Step = function(target,o) {
	this.setup = function() {
		if (o.setup) {
			o.setup.call(target);
		}
	};

	this.run = function() {
		var fake = {};
		window.XMLHttpRequest.asynchrony.started(fake);
		if (o.run) {
			o.run.call(target);
		}
		window.XMLHttpRequest.asynchrony.finished(fake);
	};

	this.async = true;

	this.check = function(scope) {
		var verify = new $context.api.unit.Verify(scope);
		if (o.check) {
			o.check.call(target,verify);
		}
	}

	this.cleanup = function() {
		if (o.cleanup) {
			o.cleanup.call(target);
		}
	}
};

var Set = function(p) {
	var target = {};
	var steps = [];
	var index = 0;
	var success = true;
	var next;

	//	Possibly this should become a constructor argument rather than a modifier method at some point
	this.target = function(page) {
		target = page;
	}

	this.test = function(test) {
		if (test.edits || test.event || test.tests) {
			steps.push(new OldStep(test));
		} else {
			steps.push(new Step(target,test));
		}
	}

	this.next = function(f) {
		next = f;
	}

	var evaluateTests = function(index) {
		if (index < 0) return;
		steps[index].check(p.scope);
		if (!p.scope.success) success = false;
		steps[index].cleanup();
	}

	var proceed = function() {
		evaluateTests(index-1);
		fire(next);
	}

	var fire = function() {
		var step = steps[index];
		if (step) {
			step.setup();
			index++;
			step.run();
			if (!step.async) {
				proceed();
			}
		} else {
			if (p.events) p.events.fire("end", (index > 0) ? success : true);
			if (p.scope.fire) p.scope.fire("end", { success: (index > 0) ? success : true });
			if (next) next();
		}
	}

	this.run = function() {
		window.XMLHttpRequest.asynchrony.next(proceed);

		if (!window.XMLHttpRequest.asynchrony.open()) fire();
	}
};

var Tests = function() {
	var events = $api.Events({ source: this });
	var scope = new $context.api.unit.Scope({ events: events });

	var set = new Set({ events: events, scope: scope });

	this.target = function(page) {
		set.target(page);
	};

	this.test = function(test) {
		set.test(test);
	};


	//	TODO	this is used by the unit test button to run the tests; could encapsulate
	this.run = function(next) {
		set.run(next);
	};
};

var global = new function() {
	var target;

	var tests = [];

	this.target = function(page) {
		target = page;
	};

	this.getTarget = function() {
		return target;
	};

	var Old = function() {
		var global = new Tests();

		this.structure = function() {
			return {
				name: "Tests",
				old: true
			};
		};

		this.run = function(_callbacks) {
			if (!_callbacks) throw new Error("Missing callbacks!");
			global.listeners.add("console", function(e) {
				window.console.log(e.detail);
			});
			global.listeners.add("test", function(e) {
				if (_callbacks.event) _callbacks.event(e);
				_callbacks.log(e.detail.success, e.detail.message);
			});
			global.listeners.add("end", function(e) {
				_callbacks.end(e.detail);
				if (_callbacks.after) {
					//	TODO	deprecated; should combine after() with end(success)
					debugger;
					_callbacks.after();
				}
			});
			global.listeners.add("log", function(e) {
				_callbacks.log(e.detail.success, e.detail.message);
			});
			global.target(target);
			for (var i=0; i<tests.length; i++) {
				global.test(tests[i]);
			}
			global.run();
		}
	};

	var New = function(suite) {
		var getStructure = function(part) {
			var rv = {
				id: part.id,
				name: part.name
			};
			if (part.parts) {
				var parts = part.parts;
				rv.parts = {};
				for (var x in parts) {
					rv.parts[x] = getStructure(parts[x]);
				}
			}
			return rv;
		};

		this.structure = function() {
			return getStructure(suite);
		};

		this.run = function(_callbacks) {
			suite.listeners.add("scenario", function(e) {
	//				_callbacks.fire(e);
				console.log("scenario", Object.keys(e.detail).join(","), e);
				_callbacks.event(e);
			});
			suite.listeners.add("test", function(e) {
				console.log("test", Object.keys(e.detail).join(","), e.detail.message, e);
	//				_callbacks.fire(e);
				_callbacks.event(e);
			});
			suite.run({},function(success) {
				console.log("success = " + success);
				_callbacks.end(success);
				//	Stop asynchronous events from being delivered
				window.XMLHttpRequest.asynchrony.next(null);
			});
		};
	};

	var delegate = new Old();

	this.test = function() {
		tests.push(arguments[0]);
	}

	this.suite = function() {
		delegate = new New(arguments[0]);
	};

	this.structure = function() {
		return delegate.structure();
	};

	this.run = function(_callbacks) {
		return delegate.run(_callbacks);
	}
};

var Scenario = function() {
	var target;

	var getTarget = function() {
		if (target) return target;
		return global.getTarget();
	};

	var tests = [];
	var next;

	this.next = function(f) {
		next = f;
	}

	this.target = function(page) {
		target = page;
	};

	this.test = function(t) {
		tests.push(t);
	}

	this.execute = function(scope,verify) {
		var set = new Set({ scope: verify.scope });
		set.target(getTarget());
		if (next) set.next(next);
		tests.forEach(function(test) {
			set.test(test);
		})
		set.run();
	}
}

$exports.target = function(page) {
	global.target(page);
};

$exports.Scenario = function() {
	Scenario.call(this);
};

//	undocumented; can be used for creating webview for tests
$exports.structure = function() {
	return global.structure();
}

$exports.suite = function() {
	global.suite(arguments[0]);
}

$exports.test = $api.deprecate(function(test) {
	global.test(test);
});

//	TODO	this is used by the unit test button to run the tests; could encapsulate
//	undocumented as it does not currently need to be directly called; called only by UI
$exports.run = function(_callbacks) {
	global.run(_callbacks);
};

//	currently undocumented
//	TODO	probably unused
$exports.nugget = new function() {
	var addLoadHook;
	if (window.addEventListener) {
		addLoadHook = function(f) {
			window.addEventListener("load", f, false);
		}
	} else if (window.attachEvent) {
		addLoadHook = function(f) {
			window.attachEvent("onload", f);
		}
	}

	this.addLoadHook = addLoadHook;
};

//	currently undocumented
$exports.fire = new function() {
	var Event = function(name,canBubble,cancelable) {
		this.name = name;
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
				var rv = document.createEventObject();
				if (false) {
					for (var x in this) {
						if (typeof(x) != "function") {
							rv[x] = this[x];
						}
					}
				}
				return rv;
			}
		}
	}

	var KeyEvent = function(name,canBubble,cancelable) {
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
//				var modifiers = [];
//				if (this.ctrlKey) modifiers.push("Control");
//				if (this.altKey) modifiers.push("Alt");
//				if (this.shiftKey) modifiers.push("Shift");
//				if (this.metaKey) modifiers.push("Meta");
// 				rv.initKeyboardEvent(
// 					v.name,v.canBubble,v.cancelable,v.view,v["char"],v.key,v.location,modifiers.join(" "),v.repeat,v.locale
// 				);
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
		detail: 0
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
};

$exports.ui = function() {
	var unit = this;

	var loadUnitTests = function() {
		var testing = document.createElement("div");
		var heading = document.createElement("h1");
		heading.appendChild(document.createTextNode("Unit Tests"));
		testing.appendChild(heading);
		var results = document.createElement("table");
		testing.appendChild(results);
		var resultsHead = results.createTHead();
		var resultsHeadRow = resultsHead.insertRow(-1);
		var resultsResultTh = resultsHeadRow.insertCell(-1);
		resultsResultTh.appendChild(document.createTextNode("Result"));
		var resultsMessageTh = resultsHeadRow.insertCell(-1);
		resultsMessageTh.appendChild(document.createTextNode("Message"));

		var unitButton = document.createElement("input");
		unitButton.setAttribute("type", "button");
		unitButton.setAttribute("value", "Unit tests");
		document.body.insertBefore(unitButton,document.body.firstChild);
		unitButton.onclick = function(e) {
			document.body.insertBefore(testing,document.body.firstChild);
			unit.run(new function() {
				var addRow = function(b,message) {
					var tbody = results.tBodies[0];
					if (!tbody) {
						results.appendChild(document.createElement("tbody"));
						tbody = results.tBodies[0];
					}
					var index = (tbody.rows.length == 0) ? 0 : tbody.rows.length-1;
					var row = tbody.insertRow(index);
					var result = row.insertCell(-1);
					result.appendChild(document.createTextNode( (b) ? "Success" : "Failure" ));
					var messageTd = row.insertCell(-1);
					messageTd.appendChild(document.createTextNode( message ));
					return row;
				}
				var last = addRow(false,"Incomplete");
				this.log = function(b,message) {
					addRow(b,message);
				}
				//	TODO	combine these two methods
				this.end = function(b) {
					addRow(b,"OVERALL");
					results.deleteRow(results.rows.length-1);
					unitButton.parentNode.removeChild(unitButton);
				}
			});
		}
	};

	loadUnitTests();
}
