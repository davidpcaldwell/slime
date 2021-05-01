//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { (value: slime.definition.verify.Export) => void } $export
	 */
	function($api,$export) {
		/** @type { slime.definition.verify.Export } */
		var Verify = function(scope) {
			/**
			 * @type { (value: any) => value is object }
			 */
			function isObject(value) {
				return value && (typeof(value) == "object" || typeof(value) == "function");
			}

			var wrapObject = $api.debug.disableBreakOnExceptionsFor(
				/**
				 * @this { { message: string, getTime: any } }
				 * @param { { [x: string]: any } } o
				 * @param { any } name
				 */
				function wrapObject(o,name) {
					var qualifyWith = function(name) {
						return function(x) {
							var isNumber = function(x) {
								return !isNaN(Number(x));
							};

							var access = (isNumber(x)) ? "[" + x + "]" : "." + x;
							return (name) ? (name + access) : access;
						};
					}

					var wrapProperty = function(o,x,name) {
						if (arguments.length != 3) throw new Error("arguments[0] = " + o + " arguments[1] = " + x + " arguments.length=" + arguments.length);
						var prefix = qualifyWith(name);
						Object.defineProperty(this, x, {
							get: function() {
								return subject(o[x],prefix(x));
							}
						});
					};

					var wrapMethod = function(o,x,name) {
						if (arguments.length != 3) throw new Error();
						var prefix = qualifyWith(name);
						var wrapped = function() {
							var argumentToString = function(v) {
								if (typeof(v) == "string") return "\"" + v + "\"";
								return String(v);
							}
							var strings = Array.prototype.map.call(arguments,argumentToString);
							var name = prefix(x)+"(" + strings.join() + ")";
							// try {
							var returned = o[x].apply(o,arguments);
							var value = subject(returned,name);
							// value.threw = new DidNotThrow(returned,name);
							return value;
							// } catch (e) {
							// 	return new DidNotReturn(e,name);
							// }
						};
						Object.assign(wrapped, o[x]);
						//wrapObject.call(wrapped,o[x]);
						return subject(wrapped,prefix(x));
					};

					for (var x in o) {
						try {
							var noSelection = (o.tagName == "INPUT" && (o.type == "button" || o.type == "checkbox"));
							if (noSelection && x == "selectionDirection") continue;
							if (noSelection && x == "selectionEnd") continue;
							if (noSelection && x == "selectionStart") continue;
							if (typeof(o) == "function" && !Object.prototype.hasOwnProperty.call(o, x)) continue;
							var value = o[x];
							if (typeof(value) == "function") {
								this[x] = wrapMethod(o,x,name);
							} else {
								if (x != "is" && x != "evaluate") {
									wrapProperty.call(this,o,x,name);
								}
							}
						} catch (e) {
							//	TODO	figure out whether this ever happens and what can be done
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
				}
			);

			var Subject = function(v,name) {
				if (!name) name = String(v);
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
					this.length = new Subject(v.length, expression + ".length");
				}

				var toLiteral = function(v) {
					if (typeof(v) == "string") return "\"" + v + "\"";
					return String(v);
				}

				var represent = function(value) {
					if (value instanceof Subject) {
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
					scope(function() {
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
					scope(function() {
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
					scope(function() {
						var success = (not) ? v != specified.value : v == specified.value;
						var message = prefix + (function() {
							if (!not && success) return "is equal to " + specified.name;
							if (!not && !success) return "is " + toLiteral(v) + ", which should be equal to " + specified.name + ", but is not.";
							if (not && success) return "is not equal to " + specified.name;
							if (not && !success) return "is " + toLiteral(v) + ", which equals " + specified.name + ", but should not.";
						})();
						return {
							success: success,
							message: message
						}
					});
				};

				this.is = Object.assign(function(value) {
					is(value);
				}, { not: void(0), type: void(0), equalTo: void(0) });
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

				this.evaluate = Object.assign(
					/**
					 *
					 * @param { (v: object) => any } f
					 */
					function(f) {
						/**
						 *
						 * @param { any } e - Almost certainly an {@link Error}, but you can technically `throw` anything
						 * @param { string } name
						 */
						function DidNotReturn(e,name) {
							var delegate = new Subject(void(0),name);

							for (var x in delegate) {
								this[x] = function() {
									/**
									 * @type { slime.definition.unit.Test.Result }
									 */
									var result = {
										success: false,
										error: e,
										message: name + " threw " + e
									};
									scope($api.Function.returning(result));
								}
							}

							this.threw = Object.assign(new Subject(e,name + " thrown"), { type: void(0), nothing: void(0) });
							this.threw.type = function(type) {
								var success = e instanceof type;
								var message = (function(success) {
									if (success) return name + " threw expected " + type.name;
									return "Threw " + e + ", not " + new type().name;
								})(success);
								scope($api.Function.returning({
									success: success,
									message: message
								}));
							};
							this.threw.nothing = function() {
								scope($api.Function.returning({
									success: false,
									message: name + " threw " + e
								}));
							}
						}

						var DidNotThrow = function(returned,name) {
							var delegate = new Subject(void(0),name);

							for (var x in delegate) {
								this[x] = function() {
									scope($api.Function.returning({
										success: false,
										message: name + " did not throw; returned " + returned
									}));
								}
							}

							this.nothing = function() {
								scope($api.Function.returning({
									success: true,
									message: name + " did not error. (returned: " + returned + ")"
								}));
							};

							this.type = function(type) {
								scope($api.Function.returning({
									success: false,
									message: name + " did not throw expected error; returned " + returned
								}))
							}
						};

						try {
							var operation = " -> " + f + "";
							var mapped = f.call(v,v);
							var value = subject(mapped,((name) ? name : "") + operation);
							//@ts-ignore
							value.threw = new DidNotThrow(mapped, operation);
							return value;
						} catch (e) {
							return new DidNotReturn(e, operation);
						}
					},
					{ property: void(0) }
				);

				if (isObject(v)) {
					wrapObject.call(this,v,name);
					this.evaluate.property = function(property) {
						return subject(v[property], ((name) ? name : "")+"." + property);
					}
				}
			};

			/** @type { slime.definition.verify.Verify } */
			//@ts-ignore
			var subject = function(value,name,lambda) {
				var rv = (function() {
					if (typeof(value) == "function") {
						var f = function() {
							var underlying = value.apply(this,arguments);
							return underlying;
						};
						Subject.call(f,value,name);
						return f;
					} else {
						return new Subject(value,name);
					}
				})();
				// var rv = new Subject(value,name);
				if (lambda) lambda(rv);
				return rv;
			};

			return subject;
		};

		$export(Verify);
	}
//@ts-ignore
)($api,$export);
