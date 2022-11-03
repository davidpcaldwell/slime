//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.java {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace context {
		export interface Engine {
			toNativeClass(javaClass: JavaClass): slime.jrunscript.native.java.lang.Class
			//	TODO	possibly this type could be object; see java.js implementation
			isNativeJavaObject(value: any): boolean
			getJavaClass(name: string): JavaClass
		}

		export interface Classpath {
			getClass(name: string): any
		}
	}

	export interface Context {
		engine: context.Engine
		classpath: context.Classpath
	}

	export namespace test {
		export const { subject, isRhino } = (function(Packages: slime.jrunscript.Packages, fifty: slime.fifty.test.Kit) {
			return {
				subject: fifty.jsh.$slime,
				isRhino: Boolean(typeof(Packages.org.mozilla.javascript.Context) == "function"
					&& (Packages.org.mozilla.javascript.Context.getCurrentContext() != null))
			};
		//@ts-ignore
		})(Packages,fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	/**
	 * Provides the ability to interact with native Java constructs.
	 */
	export interface Exports {
		/**
		 * Returns a Java class given its name.
		 *
		 * @param { string } name The name of a Java class. Note that the name expected is the VM-level class name, not the
		 * source-level class name. So for inner class `Baz` of class `foo.Bar`, the argument given should be `"foo.Bar$Baz"`.
		 * @returns { JavaClass } The JavaClass representing the Java class with the given name, or `null` if no such class exists.
		 */
		getClass(name: string): JavaClass
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var verify = fifty.verify;

			fifty.tests.exports.getClass = function() {
				var api = test.subject;

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
		/**
		 * A method that can be used to determine whether a given value is a native Java host object.
		 *
		 * @param value A value.
		 * @returns `true` if the given value is a native Java object.
		 */
		//	TODO	What about JavaPackage? JavaClass?
		isJavaObject(value: any): boolean
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const api = test.subject;
			const { isRhino } = test;

			fifty.tests.exports.isJavaObject = function() {
				verify(api).java.isJavaObject(Packages.java.lang.Runtime.getRuntime()).is(true);
				verify(api).java.isJavaObject(new Packages.java.lang.Object()).is(true);
				verify(api).java.isJavaObject(Packages.java.lang.Character.UnicodeBlock.GREEK).is(true);
				verify(api).java.isJavaObject(Packages.java.lang.reflect.Array.newInstance(api.java.toNativeClass(Packages.java.lang.Object),0)).is(true);

				verify(api).java.isJavaObject(void(0)).is(false);
				verify(api).java.isJavaObject(null).is(false);
				verify(api).java.isJavaObject(false).is(false);
				verify(api).java.isJavaObject(1).is(false);
				verify(api).java.isJavaObject(1.0).is(false);
				verify(api).java.isJavaObject("foo").is(false);
				verify(api).java.isJavaObject({}).is(false);

				verify(api).java.isJavaObject(new Packages.java.lang.String("hello world")).is(isRhino);
				verify(api).java.isJavaObject(new Packages.java.lang.Integer(4)).is(isRhino);
				verify(api).java.isJavaObject(new Packages.java.lang.Boolean(true)).is(isRhino);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export namespace exports {
		/**
		 * A function that determines whether its argument is of a certain Java type.
		 *
		 * @param value A value.
		 *
		 * @returns `true` if the value is a Java object which is an instance of the Java type; `false` otherwise.
		 */
		export type isJavaType = (value: any) => boolean
	}

	export interface Exports {
		/**
		 * A function that creates a function that can determine whether that function's argument is of the given Java type.
		 *
		 * @param javaclass A Java type, like `Packages.java.lang.Object`
		 *
		 * @returns a function which takes a single argument and returns `true` if the given argument is an object of the given Java
		 * type and `false` if it is not.
		 */
		isJavaType(javaclass: JavaClass): exports.isJavaType
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.isJavaType = function() {
				const { verify } = fifty;

				const api = test.subject;
				const { isRhino } = test;

				var filters = {
					Object: api.java.isJavaType(Packages.java.lang.Object),
					Runnable: api.java.isJavaType(Packages.java.lang.Runnable),
					OutputStream: api.java.isJavaType(Packages.java.io.OutputStream),
					InputStream: api.java.isJavaType(Packages.java.io.InputStream)
				};

				verify(filters.Object(new Packages.java.lang.Object()),"Object/Object").is(true);
				verify(filters.Runnable(new Packages.java.lang.Thread())).is(true);
				verify(filters.OutputStream(new Packages.java.io.ByteArrayOutputStream())).is(true);
				verify(filters.InputStream(new Packages.java.io.ByteArrayOutputStream())).is(false);

				verify(filters.Object(new Packages.java.lang.Integer(8))).is(isRhino);
				verify(filters.Object(new Packages.java.lang.String("8"))).is(isRhino);
				verify(filters.Object(new Packages.java.lang.Boolean(true))).is(isRhino);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		/**
		 *
		 * @param javaClass A JavaClass object.
		 * @returns The native Java class corresponding to the given class.
		 */
		toNativeClass(javaClass: JavaClass): slime.jrunscript.native.java.lang.Class
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const api = test.subject;

			fifty.tests.exports.toNativeClass = function() {
				var Object = api.java.toNativeClass(Packages.java.lang.Object);
				verify(Object).is.type("object");
				verify(Object).evaluate(function() { return String(this.getName()); }).is("java.lang.Object");
				verify(Object).evaluate(function() { return String(this.getSimpleName()); }).is("Object");
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		adapt: {
			String(s: slime.jrunscript.native.java.lang.String): string
		}
		test: any
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const api = test.subject;

			const { isRhino } = test;

			fifty.tests.jsapi = function() {
				verify(api).is.type("object");
				verify(api).java.is.type("object");

				//	Verify and document JS engine differences

				var typeofJavaInteger = (isRhino) ? "object" : "number";
				var i = new Packages.java.lang.Integer(8);
				verify(i.wait).is.type("function");
				verify(i.foo).is.type("undefined");
				verify(typeof(i)).evaluate(String).is(typeofJavaInteger);

				var javaObjectMethodTypeOnPrimitive = (isRhino) ? "undefined" : "function";
				var n = 8;
				verify(n["wait"],"number.wait").is.type(javaObjectMethodTypeOnPrimitive);
				var s = "string";
				verify(s["wait"],"string.wait").is.type(javaObjectMethodTypeOnPrimitive);
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

}
