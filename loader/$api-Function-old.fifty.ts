namespace slime.$api.fp.internal.old {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	/**
	 * @returns A return value that will replace the original function's return value, or `undefined` to leave that return value in
	 * place.
	 */
	export type Postprocessor = (p: any) => any

	/**
	 * A function intended to mutate or replace a value.
	 *
	 * A mutator function may modify the value it is given in two ways:
	 *
	 * * It may directly modify the value (if the value is mutable, like an object) in its implementation,
	 * * It may _replace_ the value entirely by returning a value.
	 *
	 * The special value $api.Function.value.UNDEFINED can be returned to replace the value with `undefined`.
	 *
	 * @param p A value to mutate or replace.
	 *
	 * @returns A replacement value, or `undefined` to indicate that the original value (which, if mutable, may have been modified)
	 * should be used.
	 */
	export type Mutator<P> = (p: P) => P

	export interface Exports {
		Function: {
			preprocessing: any

			/**
			 * Creates a function from an original function and a postprocessing function. The resulting function will be
			 * implemented by invoking the original function with its `this` and arguments, and then invoking the postprocessor with
			 * information about that call (including its return value).
			 *
			 * @param original The original function.
			 * @param postprocessing A postprocessing function.
			 *
			 * @returns
			 */
			postprocessing: {
				(original: Function, postprocessing: Postprocessor): Function
				UNDEFINED: any
			}

			value: {
				UNDEFINED: object
			}

			mutating: {
				/**
				 * Creates a function that wraps a supplied mutator function for the purpose of modifying a default value.
				 * `mutating()` is designed for use by API designers who wish to provide an override mechanism for a particular
				 * default value (especially an object). API designers may provide for a single value to be supplied which can be an
				 * object to replace the default, a function which returns a value to replace the default, or a value that mutates
				 * the default.
				 */
				<T>(f: Mutator<T>): (t?: T) => T

				/**
				 * Creates a function that returns the given value, regardless of what it is passed.
				 *
				 * @param t The value to always return.
				 */
				<T>(t: T): (t: T) => T

				/**
				 * Creates a function that will simply return its argument.
				 */
				<T>(f: undefined): (t: T) => T
			}
			Basic: any
			Revise: any
			Prepare: any
			singleton: any
			set: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const $api = fifty.global.$api as unknown as Exports;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.postprocessing = fifty.test.Parent();

			fifty.tests.jsapi.postprocessing.a = function() {
				type f = (n: number) => number;

				var doubler: f = function(x) {
					return 2 * x;
				};

				var fourXSquaredPlusX: f = $api.Function.postprocessing(doubler, function(p) {
					return p.returned * p.returned + p.arguments[0];
				}) as f;

				verify(fourXSquaredPlusX(5)).is(105);
			};

			fifty.tests.jsapi.postprocessing.b = function() {
				type f = () => string;

				var Counter = function() {
					var called = 0;

					return {
						call: function() {
							called++;
						},
						called: function() {
							return called;
						}
					};
				};

				var foo = function() {
					return "foo";
				};

				var counter = Counter();
				verify(counter).called().is(0);
				var newFoo: f = $api.Function.postprocessing(foo, counter.call) as f;
				var x = foo();
				verify(counter).called().is(0);
				var v = newFoo();
				verify(counter).called().is(1);
				verify(v).is("foo");
			}

			fifty.tests.jsapi.postprocessing.c = function() {
				var foo = function() {
					return "foo";
				};

				var calls = {
					override: $api.Function.postprocessing(foo, function(p) {
						return $api.Function.postprocessing.UNDEFINED;
					}),
					leave: $api.Function.postprocessing(foo, function(p) {
						return void(0);
					})
				};

				verify(calls).override().is(void(0));
				verify(calls).leave().is("foo");
			}

			fifty.tests.jsapi.mutating = function() {
				type T = { foo?: string, a?: string }
				var object = {
					foo: "bar"
				};

				var mutating = $api.Function.mutating(function(p) {
					p.foo = "baz";
				} as Mutator<T>);

				var result = mutating(object);
				verify(result).foo.is("baz");
				verify(result).is(object);

				var swapper = $api.Function.mutating(function(p) {
					return { a: "b" }
				}) as Mutator<T>;

				var swap = swapper(object);
				verify(swap).a.is("b");
				verify(swap).is.not(object);

				var voiding = $api.Function.mutating(function(p) {
					return $api.Function.value.UNDEFINED;
				});

				var voided = {
					value: voiding(object)
				};
				verify(voided).evaluate.property("value").is(void(0));

				var k = { foo: "k" };
				var valuer = $api.Function.mutating(k);
				var valued = valuer(object);
				verify(valued).foo.is("k");
				verify(valued).is.not(object);

				object = {
					foo: "bar"
				};
				var missinger: (t: T) => T = $api.Function.mutating(void(0));
				var missinged = missinger(object);
				verify(missinged).foo.is("bar");
				verify(missinged).is(object);

				var dummy = {};
				verify(dummy).evaluate(function() {
					return mutating();
				}).threw.type(TypeError);
				verify(dummy).evaluate(function() {
					return mutating({});
				}).threw.nothing();
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
