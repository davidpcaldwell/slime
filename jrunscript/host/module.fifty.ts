namespace slime.jrunscript.host {
	export interface Context {
		$slime: any
		globals: any
	}

	export interface Environment {
		readonly [x: string]: string
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.exports = {};
		}
	//@ts-ignore
	)(fifty);

	namespace internal.test {
		export const subject: Exports = (function(fifty: slime.fifty.test.kit) {
			return fifty.$loader.module("module.js", {
				$slime: fifty.jsh.$slime,
				globals: false
			});
		//@ts-ignore
		})(fifty)
	}

	export interface Exports {
		Environment: (java: slime.jrunscript.native.inonit.system.OperatingSystem.Environment) => Environment
	}

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.kit
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
				);

				var environment = subject.Environment(_environment);

				fifty.verify(environment).evaluate.property("foo").is("bar");
				fifty.verify(environment).evaluate.property("baz").is(void(0));

				const assignable: object = environment;
				assignable["foo"] = "baz";

				fifty.verify(assignable).evaluate.property("foo").is("bar");

				var _insensitive = _Environment(
					{ foo: "bar" },
					false
				);

				var insensitive = subject.Environment(_insensitive);

				fifty.verify(insensitive).evaluate.property("foo").is("bar");
				fifty.verify(insensitive).evaluate.property("FOO").is("bar");
				fifty.verify(insensitive).evaluate.property("baz").is(void(0));
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		getClass: Function
		isJavaObject: any
		isJavaType: any
		toNativeClass: any
		Array: any
	}

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
			fifty: slime.fifty.test.kit
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

	export interface Exports {
		invoke: any
		Properties: any
		fail: any
		ErrorType: any
		toJsArray: any
		toJavaArray: any
		Thread: any
		addShutdownHook: any
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				run(fifty.tests.exports.Environment);
				run(fifty.tests.exports.Map);
			}
		}
	//@ts-ignore
	)(fifty);

}