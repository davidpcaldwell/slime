//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	var $exports = {};

	var flag = function() {
		var rv = function(object,property) {
			var reason = arguments.callee;

			var warning = function(o) {
				if (reason.warning) {
					reason.warning(o);
				}
			};

			var deprecateFunction = function(f,object,property) {
				var rv = function() {
					var argument = { callee: f, target: this, arguments: Array.prototype.slice.call(arguments), reason: reason };
					if (object) {
						argument.object = object;
					}
					if (property) {
						argument.property = property;
					}
					try {
						warning(argument);
					} catch (e) {
						//	TODO	silently swallow?
					}
					//	TODO	Add regression to cover previous mistake of not returning this value (but invoking and then
					//			returning undefined)
					return f.apply(this,arguments);
				}
				for (var x in f) {
					rv[x] = f[x];
				}
				return rv;
			};

			var deprecateProperty = function(object,property) {
				if (typeof(object[property]) == "function") {
					object[property] = deprecateFunction(object[property],object,property);
					return;
				}
				//	We only execute the rest of this method if the accessor form of defineProperty is present
				//	TODO	Make compatible with ECMA method of get/set
				if (!$platform.Object.defineProperty || !$platform.Object.defineProperty.accessor) return function(){}();

				//	If object has neither getter nor setter, we create both with versions that cooperate with one another
				//	If object has custom getter and/or custom setter, we overwrite both with versions that wrap them with warnings
				if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property)) {
					var values = new function() {
						var value = object[property];

						this.set = function(v) {
							warning({ object: object, property: property, set: v, reason: reason });
							value = v;
						}

						this.get = function() {
							warning({ object: object, property: property, get: value, reason: reason });
							return value;
						}
					}
					object.__defineGetter__(property,values.get);
					object.__defineSetter__(property,values.set);
				} else {
					var wrapSetter = function(f) {
						return function(value) {
							warning({ object: object, property: property, set: value, reason: reason });
							if (f) {
								f.apply(this, [ value ]);
							}
						}
					}

					var wrapGetter = function(f) {
						return function() {
							var rv;
							if (f) {
								rv = f.apply(this, []);
							}
							warning({ object: object, property: property, get: rv, reason: reason });
							return rv;
						}
					}

					object.__defineGetter__(property,wrapGetter(object.__lookupGetter__(property)));
					object.__defineSetter__(property,wrapSetter(object.__lookupSetter__(property)));
				}
			};

			if (typeof(object) == "function" && arguments.length == 1) {
				return deprecateFunction(arguments[0]);
			} else if ( (typeof(object) == "object" || typeof(object) == "function") && typeof(property) == "string") {
				//	TODO	what if property is not defined? Currently we merrily deprecate it anyway. This is probably
				//			good, as a caller may attempt to set it (perhaps it is a marker property set by callers to
				//			indicate something). But it makes it harder for us to realize when a caller tries to deprecate
				//			something that is gone.
				deprecateProperty(object,property);
			} else if (typeof(object) == "object" && object != null && arguments.length == 1) {
				//	TODO	this captures prototype properties, does it not? That may not be what we want, although it
				//			might also work just fine, by assigning the deprecated versions to the specified object,
				//			leaving the prototype intact
				//	TODO	what if object is null?
				for (var x in object) {
					deprecateProperty(object,x);
				}
			} else {
				//	Tried to deprecate something that did not exist, apparently
				warning({
					flag: Array.prototype.slice.call(arguments),
					reason: reason
				});
				//	Return a function; if caller was trying to deprecate an object, caller will be expecting return value
				//	to be undefined so will probably ignore it; if caller was trying to deprecate a function, caller will
				//	get this back.
				return function() {
					throw new TypeError("Attempt to invoke deprecated non-existent function.");
				};
			}

			return function(){}();
		}
		return rv;
	}

	var deprecate = flag();
	var experimental = flag();

	$exports.deprecate = deprecate;
	$exports.experimental = experimental;

	$exports.Function = function() {
		var UNDEFINED = {};

		var Result = function() {
			this.resolve = function() {
				if (this.error) {
					throw this.throwing;
				} else {
					if (this.returning === UNDEFINED) return void(0);
					return this.returning;
				}
			};
		};

		var Situation = function() {
			var result = new Result();

			this.target = arguments[0];
			this.arguments = arguments[1];

			this.setReturn = function(v) {
				result.error = false;
				result.returning = v;
			};

			this.setThrow = function(v) {
				result.error = true;
				result.throwing = v;
			};

			this.result = result;

			this.resolve = function() {
				return result.resolve();
			};
		};

		var components = [];

		if (arguments.length != 1) {
			throw new TypeError();
		} else {
			components.push(new $exports.Function.Basic(arguments[0]));
		}

		var rv = function() {
			var situation = new Situation(this,Array.prototype.slice.call(arguments));
			components.forEach(function(component) {
				component.call(situation);
			});
			return situation.resolve();
		};

		rv.prepare = function() {
			for (var i=0; i<arguments.length; i++) {
				components.splice(i,0,new $exports.Function.Prepare(arguments[i]));
			}
			return this;
		}

		rv.revise = function() {
			for (var i=0; i<arguments.length; i++) {
				components.push(new $exports.Function.Revise(arguments[i]));
			}
			return this;
		}

		return rv;
	};
	$exports.Function.Basic = function(f) {
		return function() {
			try {
				this.setReturn(f.apply(this.target,this.arguments));
			} catch (e) {
				this.setThrow(e);
			}
		};
	};
	$exports.Function.Revise = function(f) {
		return function() {
			this.setReturn(f.call({
				target: this.target,
				arguments: this.arguments,
				throwing: this.result.throwing,
				returning: this.result.returning
			},this.result.returning));
		};
	};
	$exports.Function.Prepare = function(f) {
		return function() {
			var situation = this;
			f.apply({
				setThis: function(v) {
					situation.target = v;
				},
				setArguments: function(v) {
					situation.arguments = Array.prototype.slice.call(v);
				}
			},situation.arguments);
		}
	};
	$exports.Function.returning = function(v) {
		return function() {
			return v;
		};
	};
	$exports.Function.set = function(o) {
		return function() {
			for (var x in o) {
				this[x] = o[x];
			}
		};
	};
	$exports.Function.conditional = function(test,yes,no) {
		return function() {
			var condition = test.apply(this,arguments);
			return (condition) ? yes.apply(this,arguments) : no.apply(this,arguments);
		};
	}

	$exports.Function.argument = {};
	$exports.Function.argument.isString = function(p) {
		var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
		return function() {
			if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
			if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
			if (typeof(arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(arguments[p.index]));
		};
	};

	$exports.Function.evaluator = function() {
		//	creates a composed function that invokes each function in turn with its arguments, returning the first result that is not
		//	undefined
		var components = arguments;
		return function() {
			var rv;
			var invocation = {
				target: this,
				arguments: Array.prototype.slice.call(arguments)
			};
			for (var i=0; i<components.length; i++) {
				if (typeof(components[i]) == "function") {
					rv = components[i].apply(this,arguments);
				} else if (typeof(components[i]) == "object") {
					rv = components[i].get(invocation);
				}
				if (typeof(rv) != "undefined") {
					for (var j=i; j>=0; j--) {
						if (typeof(components[j]) == "object") {
							components[j].set(invocation,rv);
						}
					}
					return rv;
				}
			}
			return rv;
		};
	};
//	var UNDEFINED = {};
//
//	$exports.Function = function(p) {
//		var toArray = function(p) {
//			if (p && p.sort) {
//				return p;
//			} else if (p && p.call) {
//				return [p];
//			} else {
//				return [];
//			}
//		};
//
//		var runDecorators = function(declared,situation) {
//			var array = toArray(declared);
//			for (var i=0; i<array.length; i++) {
//				try {
//					var rv = array[i].call(situation);
//					if (typeof(rv) != "undefined") {
//						return { error: false, returning: rv };
//					}
//				} catch (e) {
//					return { error: true, throwing: e };
//				}
//			}
//		};
//
//		var resolve = function() {
//			if (this.error) {
//				throw this.throwing;
//			} else {
//				if (this.returning === UNDEFINED) return void(0);
//				return this.returning;
//			}
//		};
//
//		return function() {
//			var result = new function() {
//				this.resolve = resolve;
//			};
//
//			var situation = new (function() {
//				this.target = arguments[0];
//				this.arguments = arguments[1];
//
//				this.setReturn = function(v) {
//					result.error = false;
//					result.returning = v;
//				};
//
//				this.setThrow = function(v) {
//					result.error = true;
//					result.throwing = v;
//				};
//			})(this,Array.prototype.slice.call(arguments));
//
//			var decoratorResult = runDecorators(p.before,situation);
//			if (decoratorResult) return resolve.call(decoratorResult);
//			try {
//				situation.setReturn(p.call.apply(situation.target,situation.arguments));
//			} catch (e) {
//				situation.setThrow(e);
//			}
//			decoratorResult = runDecorators(p.after,situation);
//			if (decoratorResult) return resolve.call(decoratorResult);
//			return result.resolve();
//		};
//	};
//	$exports.Function.UNDEFINED = function() {
//		return UNDEFINED;
//	};
//	$exports.Function.argument = {};
//	$exports.Function.argument.isString = function(p) {
//		var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
//		return function() {
//			if (typeof(this.arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
//			if (this.arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
//			if (typeof(this.arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(this.arguments[p.index]));
//		};
//	};
	$exports.Object = {};
	$exports.Object.property = function() {
		var rv = this;
		for (var i=0; i<arguments.length; i++) {
			rv = rv[arguments[i]];
		}
		return rv;
	};
	
	$exports.Value = function(v,name) {
		return new function() {
			this.property = function() {
				return new $exports.Value($exports.Object.property.apply(v,arguments),((name)?name:"") + "." + Array.prototype.join.call(arguments,"."))
			};

			this.require = function() {
				if (!v) {
					throw new TypeError(name + " is required");
				}
			}
		}
	};
	
	$exports.Events = function(p) {
		return new function() {
			var byType = {};

			var Event = function(type,detail) {
				this.type = type;
				this.source = p.source;
				this.detail = detail;
			};

			p.source.listeners = new function() {
				this.add = function(name,handler) {
					if (!byType[name]) {
						byType[name] = [];
					}
					byType[name].push(handler);
				};

				this.remove = function(name,handler) {
					if (byType[name]) {
						var index = byType[name].indexOf(handler);
						if (index != -1) {
							byType[name].splice(index,1);
						}
					}
				};
			};

			this.fire = function(type,detail) {
				if (byType[type]) {
					byType[type].forEach(function(listener) {
						//	In a DOM-like structure, we would need something other than 'source' to act as 'this'
						listener.call(p.source,new Event(type,detail))
					});
				}
			}
		};
	}

	return $exports;
})()