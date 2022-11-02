//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.host {
	export interface Context {
		$slime: any
		globals: any
		logging: {
			prefix: string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace internal.test {
		export const subject: Exports = (function(fifty: slime.fifty.test.Kit) {
			return fifty.$loader.module("module.js", {
				$slime: fifty.jsh.$slime,
				globals: false,
				logging: {
					prefix: "slime.jrunscript.host.test"
				}
			});
		//@ts-ignore
		})(fifty)
	}

	export namespace internal.logging {
		export interface Context {
			api: {
				java: {
					Array: slime.jrunscript.host.Exports["Array"]
				}
			}
			prefix: string
		}

		export interface Exports {
			log: any
		}
	}

	export interface Environment {
		readonly [x: string]: string
	}

	export interface Exports {
		Environment: (java: slime.jrunscript.native.inonit.system.OperatingSystem.Environment) => Environment
	}

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Environment = function() {
				const { subject } = internal.test;

				var _Environment = function(o: object, caseSensitive: boolean) {
					return subject.invoke({
						method: {
							class: Packages.inonit.system.OperatingSystem.Environment,
							name: "create",
							parameterTypes: [ Packages.java.util.Map, Packages.java.lang.Boolean.TYPE ]
						},
						arguments: [ subject.Map({ object: o }), caseSensitive ]
					})
				}

				var _environment = _Environment(
					{
						foo: "bar"
					},
					true
				) as native.inonit.system.OperatingSystem.Environment;

				var environment = subject.Environment(_environment);

				fifty.verify(environment).evaluate.property("foo").is("bar");
				fifty.verify(environment).evaluate.property("baz").is(void(0));

				const assignable: object = environment;
				assignable["foo"] = "baz";

				fifty.verify(assignable).evaluate.property("foo").is("bar");

				var _insensitive = _Environment(
					{ foo: "bar" },
					false
				) as native.inonit.system.OperatingSystem.Environment;

				var insensitive = subject.Environment(_insensitive);

				fifty.verify(insensitive).evaluate.property("foo").is("bar");
				fifty.verify(insensitive).evaluate.property("FOO").is("bar");
				fifty.verify(insensitive).evaluate.property("baz").is(void(0));
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		/** The {@link slime.jrunscript.runtim.java.Exports} `getClass()` function. */
		getClass: slime.jrunscript.runtime.java.Exports["getClass"]

		/** The {@link slime.jrunscript.runtim.java.Exports} `isJavaObject()` function. */
		isJavaObject: slime.jrunscript.runtime.java.Exports["isJavaObject"]

		/** The {@link slime.jrunscript.runtim.java.Exports} `isJavaType()` function. */
		isJavaType: slime.jrunscript.runtime.java.Exports["isJavaType"]

		/** The {@link slime.jrunscript.runtim.java.Exports} `toNativeClass()` function. */
		toNativeClass: slime.jrunscript.runtime.java.Exports["toNativeClass"]
	}

	export interface Exports {
		/**
		 * Contains methods that operate on Java arrays.
		 */
		Array: {
			/**
			 * Creates a JavaScript array with the same contents as the given Java array or `java.util.List`.
			 */
			adapt: {
				<T>(p: slime.jrunscript.Array<T>): T[]
				<T>(p: slime.jrunscript.native.java.util.List<T>): T[]
			}

			/**
			 * Creates a native Java array from a JavaScript array containing Java objects.
			 */
			create: <T>(p: {
				type?: JavaClass
				array: T[]
			}) => slime.jrunscript.Array<T>
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = internal.test.subject;

			const isRhino = typeof(Packages.org.mozilla.javascript.Context) == "function"
				&& (Packages.org.mozilla.javascript.Context.getCurrentContext() != null)
			;

			function test(b) {
				verify(b).is(true);
			}

			fifty.tests.exports.Array = function() {
				var StringClass = (isRhino) ? Packages.java.lang.String : Packages.java.lang.String["class"];
				var javaArray = Packages.java.lang.reflect.Array.newInstance( StringClass, 3 );
				javaArray[0] = "Hello";
				javaArray[1] = "World";
				javaArray[2] = "David";

				var isWord = function(s) { return s + " is a word."; }
				var stringLength = function(s) { return s.length(); }

				var words = module.Array.adapt( javaArray ).map( isWord );
				var lengths = module.Array.adapt( javaArray ).map( stringLength );
				var scriptStrings = module.Array.adapt( javaArray ).map( function(s) { return String(s); } );

				test( words[1] == "World is a word." );
				test( lengths[1] == 5 );
				test( typeof(scriptStrings[0]) == "string" && scriptStrings[0] == "Hello" );

				var array = module.Array.create({ type: Packages.java.lang.Number, array: [1,2,3] });
				verify(array).evaluate(function(p) { return p.length; }).is(3);
				verify(array).evaluate(function(p) { return module.isJavaObject(array); }).is(true);

				var bytes = module.Array.create({ type: Packages.java.lang.Byte.TYPE, array: [1,2,3,4] });
				verify(bytes).evaluate(function(p) { return p.length; }).is(4);
			}
		}
	//@ts-ignore
	)(Packages,fifty);


	export interface Exports {
		/**
		 * Creates a Java `java.util.Map` object from the given JavaScript object by putting all its enumerable properties
		 * into the `Map`.
		 *
		 * @param p
		 */
		Map(p: { object: object }): slime.jrunscript.native.java.util.Map
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Map = function() {
				const { subject } = internal.test;

				var _map: slime.jrunscript.native.java.util.Map = subject.Map({ object: { foo: "bar" } } );
				fifty.verify(String(_map.get("foo"))).is("bar");
				fifty.verify(String(_map.get("baz"))).is("null");

				var object = {
					foo: "bar"
				};
				Object.defineProperty(object, "baz", {
					value: "bizzy"
				});
				var _object = subject.Map({ object: object });
				fifty.verify(String(_object.get("foo"))).is("bar");
				fifty.verify(object).evaluate.property("baz").is("bizzy");
				fifty.verify(String(_object.get("baz"))).is("null");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace logging {
		type LevelMethod = (...args: any[]) => void

		export interface Logger {
			log: (level: any, ...args: any[]) => void
			SEVERE: LevelMethod
			WARNING: LevelMethod
			INFO: LevelMethod
			CONFIG: LevelMethod
			FINE: LevelMethod
			FINER: LevelMethod
			FINEST: LevelMethod
		}
	}

	export interface Exports {
		log: {
			(...args: any[]): void
			named(name: string): logging.Logger
			initialize: (f: (record: any) => void) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.log = function() {
				const { subject } = internal.test;
				fifty.verify(subject).log.is.type("function");
				var log = subject.log.named("foo");
				fifty.verify(log).SEVERE.is.type("function");
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		Properties: any
		ErrorType: any
		toJsArray: any
		toJavaArray: any
		Thread: {
			setContextClassLoader: any
			start: any
			run: any
			thisSynchronize: any
			Monitor: any
			Task: any
			forkJoin: any
			map: any
			sleep: any
		}

		/**
		 * Adds a function to be run at VM shutdown. Note that under some scenarios (for example, a script executed without
		 * forking), this may not be at script exit.
		 *
		 * @param hook A function, which will be invoked with no arguments and the global object as `this`.
		 */
		addShutdownHook: (hook: () => void) => void
	}

	export interface Exports {
		/**
		 * Invokes a method on a Java object via reflection. Ordinarily, Java methods can simply be invoked with JavaScript
		 * semantics using a LiveConnect implementation. The `invoke` function provides the ability to invoke methods that are not
		 * accessible (for example, those that are private, package or protected).
		 *
		 * @returns The value returned by the Java method, or `undefined` for `void` methods.
		 */
		//	As of this writing, used only in tests; are there use cases for it?
		invoke: (p: {
			/**
			 * The Java object on which to invoke the method. May be omitted for `static` methods.
			 */
			target?: slime.jrunscript.native.java.lang.Object
			/**
			 * An object specifying the Java method to invoke.
			 */
			method: {
				/**
				 * The name of the method to invoke.
				 */
				name: string

				/**
				 * (optional; defaults to a method with no parameters) The list of parameter types in the signature of the method to
				 * invoke.
				 */
				parameterTypes?: JavaClass[]

				/**
				 * The declaring class of the method to be invoked. If the method is declared in the concrete class of the object,
				 * this value may be omitted.
				 */
				class?: JavaClass
			}

			/**
			 * (may be omitted if the Java method takes no arguments) The arguments with which to invoke the method.
			 */
			arguments?: (slime.jrunscript.native.java.lang.Object | boolean)[]
		}) => slime.jrunscript.native.java.lang.Object
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = internal.test.subject;

			fifty.tests.exports.invoke = function() {
				var directVersion = String(Packages.java.lang.System.getProperty("java.version"));

				var _version = module.invoke({
					method: {
						name: "getProperty",
						parameterTypes: [Packages.java.lang.String],
						class: Packages.java.lang.System
					},
					arguments: [new Packages.java.lang.String("java.version")]
				});
				var version = String(_version);
				verify(version).is(directVersion);

				var string = new Packages.java.lang.String("Hello");
				var _toString = module.invoke({
					target: string,
					method: {
						name: "toString"
					}
				});
				verify(String(_toString)).is("Hello");

				var _void = module.invoke({
					method: {
						name: "gc",
						class: Packages.java.lang.System
					}
				});
				verify(_void).is.type("undefined");

				var _v2 = Packages.java.lang.System.gc();
				verify(_v2).is.type("undefined");
			}
		}
	//@ts-ignore
	)(Packages,fifty);


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
