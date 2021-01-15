namespace slime.jrunscript.runtime.java {
	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.exports = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Classpath {
		getClass(name: string): any
	}

	export interface Engine {
		toNativeClass(javaClass: JavaClass): Packages.java.lang.Class
		//	TODO	possibly this type could be object; see java.js implementation
		isNativeJavaObject(value: any): boolean
		getJavaClass(name: string): JavaClass
	}

	export interface Context {
		engine: Engine
		classpath: Classpath
	}

	export interface Exports {
		/**
		 * Returns a Java class given its name. Note that the name expected is the VM-level class name, not the source-level class
		 * name. So for inner class `Baz` of class `foo.Bar`, the argument given should be `"foo.Bar$Baz"`.
		 *
		 * @param { string } name The name of a Java class.
		 * @returns { JavaClass } The JavaClass representing the Java class with the given name, or `null` if no such class exists.
		 */
		getClass(name: string): JavaClass
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;

			fifty.tests.exports.getClass = function() {
				var api = fifty.jsh.$slime;

				var ObjectType = api.java.getClass("java.lang.Object");
				verify(ObjectType).is.type("function");
				var Object = api.java.toNativeClass(ObjectType);
				verify(Object).is.type("object");
				verify(Object).evaluate(function() { return String(this.getName()); }).is("java.lang.Object");
				verify(Object).evaluate(function() { return String(this.getSimpleName()); }).is("Object");


				var Foo = api.java.getClass("foo.bar.Baz");
				verify(Foo).is(null);

				verify(api).java.getClass("inonit.script.runtime.io.Streams").is.type("function");
				verify(api).java.getClass("inonit.script.runtime.io.Streams$Null").is.type("function");
				verify(api).java.evaluate(function() { return String(this.getClass("inonit.script.runtime.io.Streams$Null")); }).is("[JavaClass inonit.script.runtime.io.Streams$Null]");
				verify(api).java.getClass("inonit.script.runtime.io.Streams.Null").is.type("null");
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		isJavaObject(value: any): boolean
		isJavaType(javaclass: JavaClass): (value: any) => boolean
		toNativeClass(javaClass: JavaClass): Packages.java.lang.Class
		adapt: {
			String(s: Packages.java.lang.String): string
		}
		test: any
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				run(fifty.tests.exports.getClass);
			}
		}
	//@ts-ignore
	)(fifty);

}