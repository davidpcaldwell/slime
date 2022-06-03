//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function() {
		var ToObject = function(v) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-toobject
			if (typeof(v) == "undefined" || v === null) throw new TypeError("ToObject() cannot be invoked with argument " + v);
			if (typeof(v) == "boolean") return Boolean(v);
			if (typeof(v) == "number") return Number(v);
			if (typeof(v) == "string") return String(v);
			return v;
		}

		if (!Object.assign) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-object.assign
			//	TODO	currently the basics can be tested manually with loader/test/test262.jsh.js -file local/test262/test/built-ins/Object/assign/Target-Object.js
			Object.defineProperty(Object, "assign", {
				value: function assign(target,firstSource /* to set function .length properly*/) {
					var rv = ToObject(target);
					if (arguments.length == 1) return rv;
					for (var i=1; i<arguments.length; i++) {
						var source = (typeof(arguments[i]) == "undefined" || arguments[i] === null) ? {} : ToObject(arguments[i]);
						for (var x in source) {
							rv[x] = source[x];
						}
					}
					return rv;
				},
				writable: true,
				configurable: true
			});
		}

		if (!Object.fromEntries) {
			Object.defineProperty(Object, "fromEntries", {
				value: function(iterable) {
					if (iterable instanceof Array) {
						var rv = {};
						iterable.forEach(function(item) {
							rv[item[0]] = item[1];
						});
						return rv;
					} else {
						throw new TypeError("'iterable' must currently be an array");
					}
				}
			});
		}

		if (!Object.entries) {
			Object.defineProperty(Object, "entries", {
				value: function(object) {
					var rv = [];
					for (var x in object) {
						rv.push([x, object[x]]);
					}
					return rv;
				}
			});
		}

		if (!Object.values) {
			Object.defineProperty(Object, "values", {
				value: function(object) {
					var rv = [];
					for (var x in object) {
						rv.push(object[x]);
					}
					return rv;
				}
			});
		}

		//	Copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
		if (!String.prototype.endsWith) {
			String.prototype.endsWith = function(search, this_len) {
				if (this_len === undefined || this_len > this.length) {
					this_len = this.length;
				}
				return this.substring(this_len - search.length, this_len) === search;
			};
		}

		if (!Array.prototype.find) {
			Object.defineProperty(Array.prototype, "find", {
				value: function(f, target) {
					for (var i=0; i<this.length; i++) {
						var match = f.call(target, this[i], i, this);
						if (match) return this[i];
					}
				},
				configurable: true,
				writable: true
			});
		}
	}
//@ts-ignore
)();
