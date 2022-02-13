//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.types = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace mime {
		/**
		 * A MIME type.
		 */
		export interface Type {
			/**
			 * The MIME media type for this type; for `text/plain`, `"text"`.
			 */
			media: string

			/**
			 * The MIME subtype for this type; for `text/plain`, `"plain"`.
			 */
			subtype: string

			/**
			 * Each property of the object represents a MIME type parameter of the form *`name`*=*`value`* that will be appended to
			 * the MIME type. The name of the property is the name of the parameter, while the value of the property is the value of
			 * the parameter.
			 */
			parameters: { [x: string]: string }
		}

		/**
		 * @deprecated
		 */
		 export interface Object extends Type {
			/**
			 * @deprecated
			 * @param string
			 */
			is(string: string): boolean

			/**
			 * Returns a string representation of this MIME type, suitable for a MIME type declaration.
			 */
			toString(): string
		}
	}

	export interface Resource {
		/**
		 * The name of the resource, if available.
		 */
		name: string

		/**
		 * The type of the resource, or `null` if the type cannot be determined. If no type was specified, and a name
		 * was specified, the implementation will attempt to deduce the type from the name.
		 */
		type: mime.Type,

		/**
		 * Provides the content of this resource in a format specified by its argument.
		 */
		read?: {
			/**
			 * Returns the content of this resource as a string.
			 */
			(p: StringConstructor): string

			/**
			 * Returns the content of this resource as JSON.
			 */
			(p: JSON): any

			//  XML, XMLList allowed
			/**
			 * @deprecated E4X is deprecated.
			 *
			 * Allows the XML and XMLList constructors as arguments, and returns the resource as an E4X `type="xml"` object.
			 */
			(p: any): any
		}
	}

	export namespace runtime {
		export interface Exports {
			/**
			 * Creates a {@link slime.Resource | Resource}.
			 */
			Resource: resource.Factory
		}
	}

	export namespace resource {
		/**
		 * An object that provides the implementation for a {@link slime.Resource}.
		 */
		export interface Descriptor {
			/**
			 * The MIME type of the resource.
			 */
			type?: string | mime.Type

			/**
			 * The name of the resource. May be used (by file extension, for example) to determine the type of the file.
			 */
			//	TODO	should we provide default implementation of this property that sets it to the basename as determined by
			//			path? Or to the full path?
			name?: string

			/**
			 * The content of the resource as a string.
			 */
			string?: string

			read?: {
				/**
				 * Returns the content of the resource as a string.
				 */
				string?: () => string
			}
		}

		export type Factory = new (o: Descriptor) => slime.Resource
	}

	(
		function(
			$platform: slime.runtime.$platform,
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;

			var api = (
				function(): slime.runtime.Exports {
					var scope = {
						$slime: {
							getRuntimeScript: function(path) {
								return {
									name: path,
									js: fifty.$loader.get(path).read(String)
								}
							},
							getCoffeeScript: function() {
								return null;
							}
						},
						$engine: void(0)
					}

					var rv;

					var $slime = scope.$slime;
					var $engine = scope.$engine;
					rv = eval(fifty.$loader.get("expression.js").read(String))

					return rv;
				}
			)();

			fifty.tests.types.Resource = function() {
				fifty.run(function type() {
					var toString = function(p): string { return p.toString(); };

					(function() {
						var resource = new api.Resource({});
						verify(resource).type.is(null);
					})();
					(function() {
						var resource = new api.Resource({
							type: api.mime.Type.parse("application/json")
						});
						verify(resource).type.evaluate(toString).is("application/json");
					})();
					(function() {
						var resource = new api.Resource({
							name: "foo.js"
						});
						verify(resource).type.evaluate(toString).is("application/javascript");
					})();
					(function() {
						var resource = new api.Resource({
							name: "foo.x"
						});
						verify(resource).type.is(null);
					})();
				});

				fifty.run(function name() {
					(function() {
						var resource = new api.Resource({
							name: "foo"
						});
						verify(resource).name.is("foo");
					})();
					(function() {
						var resource = new api.Resource({});
						verify(resource).evaluate.property("name").is(void(0));
					})();
				});

				fifty.run(function() {
					var readResource = function(resource: slime.Resource): string {
						return resource.read(String);
					};

					(function() {
						var resource = new api.Resource({
							string: "foo"
						});
						verify(resource).evaluate(readResource).is("foo");
					})();

					(function() {
						var resource = new api.Resource({
							read: {
								string: function() {
									return "bar";
								}
							}
						});
						verify(resource).evaluate(readResource).is("bar");
					})();

					(function() {
						var resource = new api.Resource({
							string: JSON.stringify({ foo: "bar" })
						});
						var json: { foo: string, baz?: any } = resource.read(JSON);
						verify(json).foo.is("bar");
						verify(json).evaluate.property("baz").is(void(0));
					})();
					var p = $platform;
					var global = (function() { return this; })();
					var XML = global["XML"];
					var XMLList = global["XMLList"];
					if ($platform.e4x) {
						var resource = new api.Resource({
							string: "<a><b/></a>"
						});
						var xml = resource.read(XML);
						verify(xml).is.type("xml");

						var list = { list: resource.read(XMLList) };
						verify(list).list.is.type("xml");
						verify(list).evaluate(function(v): number { return v.list.length(); }).is(1);
					}
				})
			}
		}
	//@ts-ignore
	)($platform,fifty);

	/**
	 * Generally speaking, the SLIME runtime is responsible for providing basic constructs to SLIME embeddings.
	 *
	 * The SLIME runtime (`expression.js`) is an expression that evaluates to an object providing its capabilities to
	 * the embedder.
	 *
	 * Embeddings must supply two values in the scope when executing the runtime. They must supply a value for `$engine` that is either
	 * `undefined` or is a value of type {@link $engine} specifying information about the underlying JavaScript engine, and
	 * they must supply a value for `$slime` of type {@link $slime.Deployment} that provides information about the SLIME installation.
	 *
	 * In return, the embedding will be supplied with an {@link Exports} object that provides the SLIME runtime.
	 *
	 * All code loaded by the SLIME runtime has access to the {@link $api} object (as `$api`), providing a basic set of JavaScript
	 * utilities, and a {@link $platform} object (as `$platform`), providing more advanced JavaScript engine capabilities that
	 * depend on the underlying JavaScript engine.
	 *
	 * [Older documentation](src/loader/api.html)
	 */
	export namespace runtime {
		export interface Scope {
			$engine: slime.runtime.$engine | undefined
			$slime: slime.runtime.$slime.Deployment

			/**
			 * Note that in the rare case of a browser with Java, Packages may not include inonit.* classes
			 */
			Packages: slime.jrunscript.Packages
		}

		export namespace $slime {
			export interface TypeScript {
				compile: (code: string) => string
			}

			export interface CoffeeScript {
				compile: (code: string) => string
			}

			export interface Script {
				name: string
				js: string
			}

			/**
			 * An object providing access to the SLIME execution environment.
			 */
			export interface Deployment {
				/**
				 * Provides a component source file of the runtime.
				 * @param path The path to a SLIME source file, relative to `expression.js`.
				 * @returns An executable JavaScript script. The code contained in the source file. **This interface may change to return an instance of the *script* type.**
				 */
				getRuntimeScript(path: string): Script

				/**
				 * Should provide an implementation of CoffeeScript, if one is present.
				 *
				 * @returns An object containing the CoffeeScript implementation, or `null` if CoffeeScript is not present.
				 */
				getCoffeeScript?(): {
					/**
					 * The JavaScript code for the CoffeeScript object, which can be executed to produce the CoffeeScript object.
					 */
					code?: string

					/**
					 * The CoffeeScript object.
					 */
					object?: CoffeeScript
				}

				typescript?: TypeScript

				flags?: {
					[name: string]: string
				}
			}
		}

		/**
		 * The `$engine` object can be provided in the scope by the embedding in order to provide additional capabilities the
		 * JavaScript engine may have.
		 */
		export interface $engine {
			/**
			 * @deprecated Possibly unused substantively (but used syntactically by loader/jrunscript, in a probably-obsolete way)
			 */
			Object: {
				defineProperty: any
			}

			Error?: {
				decorate: any
			}

			/**
			 * A function that can execute JavaScript code with a given scope and *target* (`this` value).
			 *
			 * @param script An object describing the file to execute.
			 * @param scope A scope to provide to the object; all the properties of this object must be in scope while the code executes.
			 * @param target An object that must be provided to the code as `this` while the code is executing.
			 */
			execute?(
				script: {
					name: string,
					/** A string of JavaScript code to execute. */
					js: string
				},
				scope: { [x: string]: any },
				target: object
			): any

			/**
			 * A constructor that implements the behavior defined by {@link $platform.MetaObject}.
			 */
			MetaObject: any
		}

		export namespace internal {
			export type LoaderConstructor = new (p: slime.loader.Source) => Loader
			export type Resource = resource.Factory
			export type methods = {
				run: any
			}
			export type createScriptScope = <T extends { [x: string]: any }>($context: T) => {
				$context: T
				$export: any
				$exports: any
			}
			export namespace mime {
				export interface Context {
					Function: slime.$api.Global["Function"]
					deprecate: slime.$api.Global["deprecate"]
				}
			}

			export namespace scripts {
				export interface Scope {
					$slime: slime.runtime.$slime.Deployment
					$platform: slime.runtime.$platform
					$engine: slime.runtime.internal.Engine
					$api: slime.$api.Global
					mime: slime.runtime.Exports["mime"]
					mimeTypeIs: (type: string) => (type: slime.mime.Type) => boolean
				}

				export interface Exports {
					methods: {
						run: (code: slime.Resource, scope: { [name: string]: any }) => void
						value: (code: slime.Resource, scope: { [name: string]: any }) => any
						file: (code: slime.Resource, context: { [name: string]: any }) => { [x: string]: any }
					}
					toExportScope: slime.runtime.Exports["Loader"]["tools"]["toExportScope"]
					createScriptScope: createScriptScope
				}

				export type Script = slime.loader.Script<Scope,Exports>
			}

			export namespace loader {
				export interface Scope {
					Resource: new (o: ConstructorParameters<slime.resource.Factory>[0]) => slime.Resource
					methods: scripts.Exports["methods"]
					createScriptScope: scripts.Exports["createScriptScope"]
					$api: slime.$api.Global
				}

				export type Script = slime.loader.Script<Scope,LoaderConstructor>
			}

			export namespace loaders {
				export interface Scope {
					toExportScope: slime.runtime.Exports["Loader"]["tools"]["toExportScope"]
					Loader: LoaderConstructor
				}

				export type Script = slime.loader.Script<Scope,slime.runtime.Exports["loader"]>
			}

			/**
			 * An internal object derived from {@link slime.runtime.$engine} which adds default implementations.
			 */
			export interface Engine {
				execute: (code: { name?: string, js: string }, scope: { [x: string]: any }, target: any) => any
				Error: {
					decorate?: <T>(errorConstructor: T) => T
				}
				MetaObject: slime.runtime.$engine["MetaObject"]
			}

			/**
			 * A subset of the {@link $slime.Deployment} interface that can load SLIME runtime scripts.
			 */
			export interface Code {
				getRuntimeScript: $slime.Deployment["getRuntimeScript"]
			}
		}

		export interface $platform {
			/** @deprecated */
			execute: any

			Object: {
				defineProperty: {
					ecma?: boolean
					accessor?: boolean
				}
			}
			e4x: any
			MetaObject: any
			java: any
		}

		(
			function(fifty: slime.fifty.test.kit) {
				fifty.tests.runtime = {
					exports: {}
				};
				fifty.tests.runtime.types = {
					exports: {}
				};
			}
		//@ts-ignore
		)(fifty);

		export namespace test {
			export const subject: slime.runtime.Exports = (function(fifty: slime.fifty.test.kit) {
				return fifty.$loader.module("fixtures.ts").subject;
			//@ts-ignore
			})(fifty);
		}

		/**
		 * An object provided by SLIME to embedders who load its runtime with a suitable {@link slime.runtime.Scope}. Provides
		 * tools that may be directly provided to callers as APIs, or may be used to build APIs useful for the embedding.
		 *
		 * ## Loading code
		 *
		 * Note that although there are global `run()`, `file()`, and `value()` methods that
		 * can be used to execute code, there is no global `module()` method. Since modules themselves load code, in
		 * order to create a module, code loading capability is needed. For this reason, the loader API exposes the ability to
		 * load modules via first creating a {@link slime.Loader} implementation and then using the
		 * `module()` method of the `Loader`.
		 */
		export interface Exports {
			Loader: internal.LoaderConstructor & {
				/** @deprecated Use `loader.source` */
				source: {
					/**
					 * @deprecated Use `loader.source.object`.
					 */
					object: Exports["loader"]["source"]["object"]
				}
				/**
				 * @deprecated Use `loader.series`.
				 */
				series: Exports["loader"]["series"]
				/**
				 * @deprecated Use `loader.tools`.
				 */
				tools: {
					/**
					 * @deprecated Use `loader.tools.toExportScope`.
					 */
					toExportScope: Exports["loader"]["tools"]["toExportScope"]
				}
			}
			loader: {
				source: {
					/**
					 * Creates an loader source defined by a single JavaScript object.
					 * @param o An object with named properties; each property either contains a loader object, in which case it
					 * is a loader which provides its children, or a resource object, whose properties are {@link resource.Descriptor}s.
					 */
					 object: (o: object) => loader.Source
				}
				series: (loaders: Loader[]) => Loader
				tools: {
					toExportScope: <T extends { [x: string]: any }>(t: T) => T & { $export: any, $exports: any }
				}
			}
		}

		export interface Exports {
			run: (code: slime.Resource, scope?: { [name: string]: any }, target?: object ) => void
			file: any
			value: any
			namespace: any
			$platform: $platform
			java?: any
			$api: slime.$api.Global
			/**
			 * @deprecated Replaced by `$api.mime`.
			 */
			mime: slime.$api.mime.Export
			readonly typescript: slime.runtime.$slime.TypeScript
		}
	}
}

namespace slime.test {
	declare type api = { convert: (input: number) => number };
	export type factory = slime.loader.Script<{ scale: number }, api>;
}

(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: any,
		fifty: slime.fifty.test.kit
	) {
		tests.suite = function() {
			fifty.run(fifty.tests.types.Resource);
			fifty.load("mime.fifty.ts");
			fifty.load("$api-Function.fifty.ts");
			fifty.load("Loader.fifty.ts");
		}
	}
//@ts-ignore
)($loader,verify,tests,fifty)
