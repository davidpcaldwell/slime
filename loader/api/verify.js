//@ts-check
(
	/**
	 * @param { { Verify: ( scope: slime.definition.verify.Scope ) => slime.definition.verify.Verify } } $exports
	 */
	function($exports) {
		//	We have an object called Object in this file, so this
		var defineProperty = (function() {
			var global = this;
			return global.Object.defineProperty;
		})();

		/** @type { slime.definition.verify.Factory } */
		var Verify = function(scope) {
			var Value = function(v,name) {
				var prefix = (name) ? (name + " ") : "";

				this.toString = function() {
					return "Verify(" + v + ")";
				}

				if (typeof(v) != "object" || !v) {
					this.name = name;
					this.value = v;
				}

				if (typeof(v) == "string") {
					var expression = (name) ? name : "\"" + v + "\"";
					this.length = new Value(v.length, expression + ".length");
				}

				var toLiteral = function(v) {
					if (typeof(v) == "string") return "\"" + v + "\"";
					return String(v);
				}

				var represent = function(value) {
					if (value instanceof Value) {
						return value;
					} else {
						return {
							value: value,
							name: toLiteral(value)
						};
					}
				}

				var is = function(value,not) {
					var specified = represent(value);
					scope.test(function() {
						var success = (not) ? v !== specified.value : v === specified.value;
						var message = prefix + (function() {
							if (!not && success) return "is " + specified.name;
							if (!not && !success) return "is " + toLiteral(v) + ", but should be " + specified.name;
							if (not && success) return "is " + toLiteral(v) + ", not " + specified.name;
							if (not && !success) return "is " + toLiteral(v) + ", but should not be.";
						})();
						return {
							success: success,
							message: message
						}
					});
				}

				var isType = function(value) {
					scope.test(function() {
						var type = (function() {
							if (v === null) return "null";
							return typeof(v);
						})();
						return new function() {
							this.success = (type == value);
							this.message = prefix + ((this.success)
								? "is type " + value
								: "is type " + type + ", not " + value
							);
						};
					});
				}

				var isEqualTo = function(value,not) {
					var specified = represent(value);
					scope.test(function() {
						var success = (not) ? v != specified.value : v == specified.value;
						var message = prefix + (function() {
							if (!not && success) return "is equal to " + specified.name;
							if (!not && !success) return "is " + toLiteral(v) + ", which is not equal to " + specified.name;
							if (not && success) return "is not equal to " + specified.name;
							if (not && !success) return "is " + toLiteral(v) + ", which equals " + specified.name + ", but should not.";
						})();
						return {
							success: success,
							message: message
						}
					});
				};

				this.is = function(value) {
					is(value);
				};
				this.is.not = function(value) {
					is(value,true);
				};
				this.is.type = function(value) {
					isType(value);
				}

				this.is.equalTo = function(value) {
					return isEqualTo(value,false);
				}
				this.is.not.equalTo = function(value) {
					return isEqualTo(value,true);
				}

				// this.isUndefined = $api.deprecate(function() {
				// 	is(void(0));
				// });

				// this.isNotEqualTo = $api.deprecate(function(value) {
				// 	return isEqualTo(value,true);
				// });
			};

			var prefixFactory = function(name) {
				return function(x) {
					var isNumber = function(x) {
						return !isNaN(Number(x));
					};

					var access = (isNumber(x)) ? "[" + x + "]" : "." + x;
					return (name) ? (name + access) : access;
				};
			}

			var wrapMethod = function(o,x,name) {
				if (arguments.length != 3) throw new Error();
				var prefix = prefixFactory(name);
				var wrapped = function() {
					var argumentToString = function(v) {
						if (typeof(v) == "string") return "\"" + v + "\"";
						return String(v);
					}
					var strings = Array.prototype.map.call(arguments,argumentToString);
					var name = prefix(x)+"(" + strings.join() + ")";
					// try {
					var returned = o[x].apply(o,arguments);
					var value = rv(returned,name);
					// value.threw = new DidNotThrow(returned,name);
					return value;
					// } catch (e) {
					// 	return new DidNotReturn(e,name);
					// }
				};
				wrapObject.call(wrapped,o[x]);
				return wrapped;
			};

			var wrapProperty = function(o,x,name) {
				if (arguments.length != 3) throw new Error("arguments[0] = " + o + " arguments[1] = " + x + " arguments.length=" + arguments.length);
				var prefix = prefixFactory(name);
				defineProperty(this, x, {
					get: function() {
						return rv(o[x],prefix(x));
					}
				});
			};

			var wrapObject = $api.debug.disableBreakOnExceptionsFor(function(o,name) {
				for (var x in o) {
					try {
						var noSelection = (o.tagName == "INPUT" && (o.type == "button" || o.type == "checkbox"));
						if (noSelection && x == "selectionDirection") continue;
						if (noSelection && x == "selectionEnd") continue;
						if (noSelection && x == "selectionStart") continue;
						if (typeof(o) == "function" && !o.hasOwnProperty(x)) continue;
						var value = o[x];
						if (typeof(value) == "function") {
							this[x] = wrapMethod(o,x,name);
						} else {
							if (x != "is" && x != "evaluate") {
								wrapProperty.call(this,o,x,name);
							}
						}
					} catch (e) {
					}
				}

				if (o instanceof Array) {
					wrapProperty.call(this,o,"length",name);
				}
				if (o instanceof Date) {
					this.getTime = wrapMethod(o,"getTime",name);
				}
				if (o instanceof Error && !this.message) {
					wrapProperty.call(this,o,"message",name);
				}
			});

			var Object = function(o,name) {
				Value.call(this,o,name);

				wrapObject.call(this,o,name);

				this.evaluate = function(f) {
					var DidNotReturn = function(e,name) {
						var delegate = new Value(void(0),name);

						for (var x in delegate) {
							this[x] = function() {
								scope.test($api.Function.returning({
									success: false,
									error: e,
									message: name + " threw " + e
								}));
							}
						}

						this.threw = new Object(e,name + " thrown");
						this.threw.type = function(type) {
							var success = e instanceof type;
							var message = (function(success) {
								if (success) return name + " threw expected " + type.name;
								return "Threw " + e + ", not " + new type().name;
							})(success);
							scope.test($api.Function.returning({
								success: success,
								message: message
							}));
						};
						this.threw.nothing = function() {
							scope.test($api.Function.returning({
								success: false,
								message: name + " threw " + e
							}));
						}
					};

					var DidNotThrow = function(returned,name) {
						var delegate = new Value(void(0),name);

						for (var x in delegate) {
							this[x] = function() {
								scope.test($api.Function.returning({
									success: false,
									message: name + " did not throw; returned " + returned
								}));
							}
						}

						this.nothing = function() {
							scope.test($api.Function.returning({
								success: true,
								message: name + " did not error. (returned: " + returned + ")"
							}));
						};

						this.type = function(type) {
							scope.test($api.Function.returning({
								success: false,
								message: name + " did not throw expected error; returned " + returned
							}))
						}
					};

					try {
						var mapped = f.call(o,o);
						var value = rv(mapped,((name) ? name : "")+"{" + f + "}");
						value.threw = new DidNotThrow(mapped,"{" + f + "}");
						return value;
					} catch (e) {
						return new DidNotReturn(e,"{" + f + "}");
					}
				};
				this.evaluate.property = function(property) {
					return rv(o[property], ((name) ? name : "")+"." + property);
				}
			};

			var delegates = [];

			/** @type { slime.definition.verify.Verify } */
			var rv = function(value,name) {
				for (var i=0; i<delegates.length; i++) {
					if (delegates[i].accept(value)) {
						return delegates[i].wrap(value);
					}
				}
				if (value && typeof(value) == "object") {
					var localName = (function() {
						if (name) return name;
					})();
					return new Object(value,localName);
				}
				return new Value(value,name);
			};

			//	For TypeScript
			rv.scenario = void(0);
			rv.suite = void(0);
			rv.test = void(0);
			rv.fire = void(0);
			rv.scope = void(0);

			return rv;
		};

		$exports.Verify = Verify;
	}
//@ts-ignore
)($exports)