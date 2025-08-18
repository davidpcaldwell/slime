//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * A module providing interoperability with Java.
 */
namespace slime.jrunscript.java {
	export interface Context {
		$slime: Pick<slime.jrunscript.runtime.Exports,"java"|"classpath">

		/**
		 * If `true`, this module modifies global JavaScript objects.
		 */
		globals: boolean

		logging: {
			prefix: string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace internal.test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			return script({
				$slime: fifty.jsh.$slime,
				globals: false,
				logging: {
					prefix: "slime.jrunscript.host.test"
				}
			});
		//@ts-ignore
		})(fifty)
	}

	export interface Environment {
		readonly [x: string]: string
	}

	export interface Exports {
		/** The {@link slime.jrunscript.runtime.java.Exports} `getClass()` function. */
		getClass: slime.jrunscript.runtime.java.Exports["getClass"]

		/** The {@link slime.jrunscript.runtime.java.Exports} `isJavaObject()` function. */
		isJavaObject: slime.jrunscript.runtime.java.Exports["isJavaObject"]

		/** The {@link slime.jrunscript.runtime.java.Exports} `isJavaType()` function. */
		isJavaType: slime.jrunscript.runtime.java.Exports["isJavaType"]

		/** The {@link slime.jrunscript.runtime.java.Exports} `toNativeClass()` function. */
		toNativeClass: slime.jrunscript.runtime.java.Exports["toNativeClass"]
	}

	/**
	 * @deprecated
	 *
	 * An attempt to build a group of nested JavaScript objects out of a single Java properties instance. Causes ugly edge cases
	 * when you have properties like `a=foo`, `a.b=bar`, `a.c=baz`, in which a then has two properties `b` and `c`, but also a
	 * value of its own. Would be easier just to use FP techniques to deal with subsets of Java properties.
	 */
	export type OldProperties = object

	/**
	 * A JavaScript representation of the `java.util.Properties` type: an object with string keys and string values.
	 */
	export interface Properties {
		[name: string]: string
	}

	export interface Exports {
		Properties: exports.Properties
	}

	export namespace exports {
		export interface Properties {
			value: (name: string) => (properties: slime.jrunscript.java.Properties) => slime.$api.fp.Maybe<string>

			/** @deprecated */
			adapt: (_java: slime.jrunscript.native.java.util.Properties) => OldProperties

			/**
			 * A {@link Codec} which converts between a JavaScript {@link Properties} representation of Java properties and the native
			 * `java.util.Properties` type.
			 */
			codec: {
				java: slime.Codec<slime.jrunscript.java.Properties,slime.jrunscript.native.java.util.Properties>
			}
		}

		(
			function(
				Packages: slime.jrunscript.Packages,
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;

				const module = internal.test.subject;

				fifty.tests.exports.Properties = fifty.test.Parent();

				fifty.tests.exports.Properties.adapt = function() {
					var $p = new Packages.java.util.Properties();
					$p.setProperty("a.a", "a");
					$p.setProperty("a.b", "b");
					$p.setProperty("a.c", "c");
					var p = module.Properties.adapt($p);
					//	Note that for-in loop would yield four properties, including toString(), but this seems fine
					jsh.shell.console(Object.keys(p["a"]).toString());
					verify(p).evaluate.property("a").evaluate(function(a) { return Object.keys(a); }).length.is(3);
				}

				fifty.tests.exports.Properties.codec = function() {
					var values = {
						a: "1"
					};

					var encoded = module.Properties.codec.java.encode(values);
					jsh.shell.console(String(encoded));
					verify(encoded.getProperty("a")).evaluate(String).is("1");
					verify(encoded.getProperty("foo")).is(null);

					var decoded = module.Properties.codec.java.decode(encoded);
					verify(decoded).a.is("1");
					verify(decoded).evaluate.property("foo").is(void(0));
				}
			}
		//@ts-ignore
		)(Packages,fifty);

		export interface Properties {
			from: {
				/**
				 * Parses a file in Java properties format and returns a JavaScript {@link Properties} object.
				 */
				string: slime.$api.fp.Mapping<string,slime.jrunscript.java.Properties>
			}

			/**
			 * Converts a JavaScript {@link Properties} object to the Java properties file format.
			 */
			string: slime.$api.fp.Mapping<slime.jrunscript.java.Properties,string>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				const { subject } = internal.test;

				fifty.tests.exports.Properties.string = function() {
					var test = [
						"#Foo",
						"#Tue Jan 02 14:42:08 EST 2024",
						"foo=bar",
						"baz=bizzy"
					].join("\n");

					var object = subject.Properties.from.string(test);

					verify(object).evaluate.property("foo").is("bar");
					verify(object).evaluate.property("baz").is("bizzy");
					verify(object).evaluate.property("nope").is(void(0));

					var string = subject.Properties.string(object);

					verify(string.split("\n")).length.is(3);
					verify(string.split("\n"))[2].is("");

					var parsed = subject.Properties.from.string(test);
					verify(parsed).evaluate.property("foo").is("bar");
					verify(parsed).evaluate.property("baz").is("bizzy");
					verify(parsed).evaluate.property("nope").is(void(0));
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		vm: {
			properties: slime.$api.fp.impure.Input<Properties>,
			setProperty: (name: string) => slime.$api.fp.impure.Output<string>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = internal.test;

			fifty.tests.exports.vm = fifty.test.Parent();

			fifty.tests.exports.vm.properties = fifty.test.Parent();

			fifty.tests.exports.vm.properties.all = function() {
				var value = subject.vm.properties();
				jsh.shell.console(JSON.stringify(value,void(0),4));
				verify(value)["java.home"].is.type("string");
				verify(value).evaluate.property("foo").is.type("undefined");
			}

			fifty.tests.exports.vm.properties.value = function() {
				var exists = $api.fp.now.invoke(
					subject.vm.properties(),
					subject.Properties.value("java.home")
				);
				verify(exists.present).is(true);
				var foo = $api.fp.now.invoke(
					subject.vm.properties(),
					subject.Properties.value("foo")
				);
				verify(foo.present).is(false);
			}

			fifty.tests.manual
		}
	//@ts-ignore
	)(fifty);

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

				var _Environment = function(o: { [key: string]: string }, caseSensitive: boolean) {
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
			 *
			 * @returns A Java array containing the elements in the JavaScript array.
			 */
			create: {
				(p: {
					type?: JavaClass<slime.jrunscript.native.java.lang.Number>
					array: number[]
				}): slime.jrunscript.Array<slime.jrunscript.native.java.lang.Number>

				(p: {
					type?: JavaClass<slime.jrunscript.native.java.lang.String>
					array: string[]
				}): slime.jrunscript.native.java.lang.String[]

				<T extends slime.jrunscript.native.java.lang.Object>(p: {
					/**
					 * A reference to a Java class, e.g., `Packages.java.lang.Object`, representing the type of the array to create.
					 */
					type?: JavaClass<T>

					/**
					 * A JavaScript array to be converted.
					 */
					array: T[]
				}): slime.jrunscript.Array<T>
			}
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = internal.test.subject;

			const hasRhinoCode = Boolean(typeof(Packages.org.mozilla.javascript.Context) == "function");
			const isRhino = hasRhinoCode
				&& (Packages.org.mozilla.javascript.Context.getCurrentContext() != null)
			;

			function test(b: boolean) {
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
		Map: <V>(p: { object: { [key: string]: V } }) => slime.jrunscript.native.java.util.Map<string,V>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Map = function() {
				const { subject } = internal.test;

				var _map: slime.jrunscript.native.java.util.Map<string,string> = subject.Map({ object: { foo: "bar" } } );
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

	export interface Exports {
		log: logging.old.Exports

		logging: logging.Exports
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
		/**
		 * Converts an ECMAScript array into a Java array
		 */
		toJavaArray: any
	}

	export interface Exports {
		ErrorType: any
		toJsArray: any

		/**
		 * Adds a function to be run at VM shutdown. Note that under some scenarios (for example, a script executed without
		 * forking), this may not be at script exit.
		 *
		 * @param hook A function, which will be invoked with no arguments and the global object as `this`.
		 */
		addShutdownHook: (hook: () => void) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Thread = fifty.test.Parent();

			fifty.tests.exports.Thread.object = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		//	TODO	a comment in api.html claimed "(conditional; not implemented for Nashorn)" but I believe this is implemented
		//			for Nashorn
		Thread: internal.threads.Exports
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
			const { jsh } = fifty.global;
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				if (!jsh.shell.environment.SLIME_TEST_NO_JAVA_THREADS) fifty.load("threads.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
