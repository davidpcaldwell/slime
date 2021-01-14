namespace slime.jrunscript.host {
	export interface Context {
		$slime: any
		globals: any
	}

	export interface Exports {
		Environment: (java: Packages.inonit.system.OperatingSystem.Environment) => { readonly [x: string]: string }
	}

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				var subject: Exports = fifty.$loader.module("module.js", {
					$slime: fifty.jsh.$slime,
					globals: false
				});

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
		Map: any
		invoke: any
		Properties: any
		fail: any
		ErrorType: any
		toJsArray: any
		toJavaArray: any
		Thread: any
		addShutdownHook: any
	}
}