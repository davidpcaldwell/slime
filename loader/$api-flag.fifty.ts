//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	/**
	 * Allows the runtime marking of particular API constructs. These APIs can execute a globally specified callback,
	 * specified by this object's `warning` property, upon accesses.
	 *
	 * This function is overloaded, and supports a version that marks named properties of objects, and a version that deprecates
	 * functions.
	 */
	export interface Flagger {
		/**
		 * A function that can be used to flag a particular function.
		 *
		 * @param f A function to mark
		 * @returns A marked version of the function that invokes the `Flagger`'s callback for each access
		 */
		<F extends slime.external.lib.es5.Function<any,any,any>>(f: F): F

		/**
		 * A function that can be used to flag a named property on an object.
		 *
		 * @param o A target object whose property will be marked.
		 * @param property The name of the property to mark. If omitted, <strong>all</strong> properties will be marked.
		 */
		(o: object, property?: string): void

		warning: (o: any) => void
	}

	export interface Global {
		/**
		 * Allows the runtime deprecation of particular API constructs.
		 */
		deprecate: Flagger

		/**
		 * Allows the runtime marking of particular API constructs as experimental.
		 */
		experimental: Flagger
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const api = fifty.global.$api;
			const { $platform } = fifty.global;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.deprecate = fifty.test.Parent();

			fifty.tests.jsapi.deprecate._function = function() {
				var called = 0;
				var warnings = 0;
				var f = function() {
					called++;
					return called;
				};
				var warning = function(p) {
					//	TODO	could improve definition of $api.deprecate.warning function to avoid this type-unsafe construct
					//@ts-ignore
					verify(p.callee).is(f);
					warnings++;
				};
				api.deprecate.warning = warning;

				var deprecated = api.deprecate(f);
				verify(f()).is(1);
				verify(warnings).is(0);
				verify(deprecated()).is(2);
				verify(warnings).is(1);
				verify(deprecated()).is(3);
				verify(warnings).is(2);
			}

			fifty.tests.jsapi.deprecate.object = function() {
				var called = 0;
				var warnings = [];
				var warning = function(p) {
					warnings.push(p);
				}
				api.deprecate.warning = warning;
				var o: { p: number, m: () => number } = new function() {
					this.p = 1;
					this.m = function() {
						return 2;
					};
				};
				verify(api.deprecate(o)).is(void(0));
				var p = o.p;
				verify(p).is(1);
				var m = o.m();
				verify(m).is(2);
				verify(warnings).length.is(2);
				//	TODO	test content of warnings
			};

			fifty.tests.jsapi.deprecate.properties = function() {
				var f = Object.assign(function() {
					return 8;
				}, { property: "foo" });

				var o: { f: typeof f } = new function() {
					this.f = f;
				};
				api.deprecate(o, "f");

				var Flagged = function() {
					var warnings = [];

					var callback = function(warning) {
						warnings.push(warning);
					}

					api.deprecate.warning = callback;

					this.warnings = warnings;
				};

				// TODO: right now mere property access to a method does *not* trigger a warning; only invocation does
				verify(f == o.f).is(false);
				var flagged: { warnings: any[] } = new Flagged();
				verify(flagged).warnings.length.is(0);
				verify(o).f().is(8);
				verify(flagged).warnings.length.is(1);
				verify(f.property).is("foo");
				verify(o.f.property).is("foo");
			};

			fifty.tests.jsapi._4 = function() {
				var verify_test = function(f: () => { success: boolean, message: string }) {
					var it = f();
					if (!it.success) {
						verify("success").is(it.message);
					}
				};

				var deprecate = api.deprecate;

				//	TODO	Add a test somewhere in here where we attempt to set a deprecated property, do not really
				//			set it, and confirm that our callback receives the attempted (not actual) value
				var expectWarn = function(b) {
					var rv = Object.assign(
						function(content) {
							if (content.reason != deprecate) throw new Error("Not expected reason.");
							rv.actual = true;
						},
						{
							actual: false,
							expect: b,
							test: function() {
								return rv.actual == rv.expect
							},
							evaluate: function(message?) {
								var success = this.test();
								var m;
								if (!message) {
									m = (success) ? "expectWarn PASS: expect=" + rv.expect + " actual=" + rv.actual : "expectWarn FAIL: expect=" + rv.expect + " actual=" + rv.actual;
								} else {
									m = (success) ? message + " passed." : message + " FAILED.";
								}
								verify_test(function() {
									return { success: success, message: m };
								});
							}
						}
					);
					api.deprecate.warning = rv;
					//$unit.context.setWarning(rv);
					return rv;
				}

				//	Each test either uses the jsunit Tests object or uses a custom console output
				//	Hook for execution environment to override console function
				var Tests;
//						var test = function(f,message) {
//							scope.test(f);
//						}

				//
				//	Begin tests
				//

				var x = {
					foo: "bar",
					bar: void(0),
					toString: function() {
						return "x1";
					}
				}

				deprecate(x,"foo");
				var yes = expectWarn(true);
				var accessIt = x.foo;
				yes.evaluate("get x.foo");
				//test(warning.test);

				//	Should FAIL
				//expectWarn(true);
				//test(warning.test);
				//

				//console("x1.foo = " + x.foo);
				var yes = expectWarn(true);
				x.foo = "baz";
				yes.evaluate();
				verify_test(function() {
					var success = x.foo == "baz";
					var message = (success) ? "Value correct" : "Value " + x.foo;
					return {
						success: success,
						message: message
					}
				});

				var yes = expectWarn(false);
				x.bar = "baz";
				yes.evaluate();

				//console("x1.foo = " + x.foo);
				var x2: { foo: string } = new function() {
					this.foo = "bar";
					this.__defineSetter__("foo", function(value) {
						this.$foo = value;
					} );

					deprecate(this, "foo");
				}

				var yes = expectWarn(true);
				var access_it_2 = x2.foo;
				yes.evaluate();

				var yes = expectWarn(true);
				x2.foo = "BAR";
				yes.evaluate();
				verify(x2.foo, "foo is still").is(void(0));

				var x3: { foo: number } = new function() {
					this.foo = 0;

					var foo = 0;

					this.__defineGetter__("foo", function() {
						return ++foo;
					} );

					deprecate(this, "foo");
				}

				var yes = expectWarn(true);
				var z_ = x3.foo;
				yes.evaluate();
				verify(z_ > 0, "Getter-only value increasing").is(true);
				verify(x3, "Getter-only value increasing").evaluate(function() { return this.foo > z_; }).is(true);
//							test(z > 0, "Getter-only value increasing.");
//							test(x3.foo > z, "Getter-only value increasing.");

				var yes = expectWarn(true);
				x3.foo = 11;
				yes.evaluate();
				verify(x3).foo.is.not(11);
//							test(x3.foo != 11, "Cannot re-set once getter defined.");

				x3.__defineGetter__("foo", function() {
					return 42;
				});
				var yes = expectWarn(false);
				var access_it_3 = x3.foo;
				yes.evaluate();
				verify(x3).foo.is(42);
//							test(x3.foo == 42, "Value is correct when getter redefined.");

				var x4: { foo: number } = new function() {
					var foo = 21;

					this.__defineGetter__("foo", function() {
						return foo;
					} );

					this.__defineSetter__("foo", function(value) {
						return (foo = value);
					} );

					deprecate(this, "foo");
				}

				var yes = expectWarn(true);
				var access_it_4 = x4.foo;
				yes.evaluate();
				verify(access_it_4).is(21);
				verify(x4).foo.is(21);
//							test(z == 21);
//							test(x4.foo == 21);

				var yes = expectWarn(true);
				x4.foo = 14;
				yes.evaluate();
				verify(x4).foo.is(14);
//							test(x4.foo == 14);

				var x5 = new function() {
					this.doIt = function() {
					}

					this.doItBetter = function() {
					}

					deprecate(this, "doIt");
				}

				var yes = expectWarn(true);
				x5.doIt();
				yes.evaluate();

				var yes = expectWarn(false);
				x5.doItBetter();
				yes.evaluate();
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);
}
