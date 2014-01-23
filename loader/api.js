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

	$exports.Function = function(p) {
		return function() {
			var called = {
				target: this,
				arguments: Array.prototype.slice.call(arguments)
			};
			var before = [];
			if (p.before && p.before.sort) {
				before = p.before;
			} else if (p.before && p.before.call) {
				before = [p.before];
			}
			//	TODO	should we allow replacement of 'this' as well as arguments?
			for (var i=0; i<before.length; i++) {
				before[i].call(null,called);
			}
			called.returned = p.call.apply(called.target,called.arguments);
			var after = [];
			if (p.after && p.after.sort) {
				after = p.after;
			} else if (p.after && p.after.call) {
				after = [p.after];
			}
			for (var i=0; i<after.length; i++) {
				after[i].call(null,called);
			}
			return called.returned;
		};
	};
	$exports.Function.argument = {};
	$exports.Function.argument.isString = function(p) {
		var reference = (p.name) ? "arguments[" + p.index + "]" : "arguments[" + p.index + "] (" + p.name + ")";
		return function(m) {
			if (typeof(m.arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
			if (m.arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
			if (typeof(m.arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(m.arguments[p.index]));
		};
	};

	return $exports;
})()