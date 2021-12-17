//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

interface Object {
	__defineGetter__: Function
}

//	Copied from lib.es2015.symbol.d.ts
declare var Symbol: SymbolConstructor;

//	Copied from lib.es2015.iterable.d.ts
interface SymbolConstructor {
	/**
	 * A method that returns the default iterator for an object. Called by the semantics of the
	 * for-of statement.
	 */
	readonly iterator: symbol;
}

interface IteratorYieldResult<TYield> {
	done?: false;
	value: TYield;
}

interface IteratorReturnResult<TReturn> {
	done: true;
	value: TReturn;
}

//  TODO    in some version after 4.0.5, this is declared elsewhere
//@ts-ignore
type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> | IteratorReturnResult<TReturn>;

interface Iterator<T, TReturn = any, TNext = undefined> {
	// NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
	next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
	return?(value?: TReturn): IteratorResult<T, TReturn>;
	throw?(e?: any): IteratorResult<T, TReturn>;
}

interface Iterable<T> {
	[Symbol.iterator](): Iterator<T>;
}

//	https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type
type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

namespace slime {
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
		name: string
		type: mime.Type,
		read?: {
			(p: StringConstructor): string
			(p: JSON): any
			//  XML, XMLList allowed
			(p: any): any
		}
	}

	export namespace resource {
		export interface Descriptor {
			type?: string | mime.Type
			name?: string
			read?: {
				string?: () => string
			},
			string?: string
		}

		export type Factory = new (o: Descriptor) => slime.Resource
	}

	export interface Loader {
		source: loader.Source
		run: (path: string, scope?: any, target?: any) => void
		value: (path: string, scope?: any, target?: any) => any
		file: (path: string, $context?: any, target?: any) => any
		module: (path: string, $context?: any, target?: any) => any
		script: <C,E>(path: string) => loader.Script<C,E>
		Child: {
			(prefix: string): Loader
		}
		get: (path: string) => Resource
		list?: (m?: { filter?: any, descendants?: any }) => ( loader.LoaderEntry | loader.ResourceEntry )[]

		/** @deprecated Replaced by `script`. */
		factory: Loader["script"]
	}

	export namespace loader {
		interface Entry {
			path: string
		}

		export interface LoaderEntry extends Entry {
			loader: slime.Loader
		}

		export interface ResourceEntry extends Entry {
			resource: any
		}

		export interface Script<C,E> {
			(c?: C): E
		}

		/** @deprecated Replaced by {@link Script}. */
		export type Product<C,E> = Script<C,E>

		export type Export<T> = (value: T) => void

		/**
		 * An object that provides the implementation for a {@link Loader}.
		 */
		export interface Source {
			get: (path: string) => resource.Descriptor

			list?: (path: string) => {
				path: string
				loader: boolean
				resource: boolean
			}[]

			/**
			 * Internal use only; may be removed.
			 */
			child?: any

			/**
			 * Internal use only; may be removed.
			 */
			//  TODO    is this used?
			Resource?: resource.Factory
		}

		export interface Scope {
			$context: any
			$loader?: slime.Loader
			$exports: any
			$export: ($exports: any) => void
		}
	}

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

			/**
			 * An object providing access to the SLIME execution environment.
			 */
			export interface Deployment {
				/**
				 * Provides a component source file of the runtime.
				 * @param path The path to a SLIME source file, relative to `expression.js`.
				 * @returns An executable JavaScript script. The code contained in the source file. **This interface may change to return an instance of the *script* type.**
				 */
				getRuntimeScript(path: string): { name: string, js: string }

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
			export type LoaderConstructor = new (p: loader.Source) => Loader
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
				var code = fifty.$loader.get("expression.js");
				var js = code.read(String);

				var subject: slime.runtime.Exports = (function() {
					var scope = {
						$slime: {
							getRuntimeScript: function(path) {
								var resource = fifty.$loader.get(path);
								return { name: resource.name, js: resource.read(String) }
							}
						},
						$engine: void(0)
					}
					return eval(js);
				})();

				return subject;
			//@ts-ignore
			})(fifty)
		}

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

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var tests = fifty.tests;
				var verify = fifty.verify;
				var $loader = fifty.$loader;

				tests.runtime.types.exports.Loader = function(it: Exports["Loader"]) {
					verify(it).is.type("function");
					var tools: { [x: string]: any } = it.tools;
					verify(tools).is.type("object");
					verify(tools).evaluate.property("toExportScope").is.type("function");
				};

				tests.loader = function() {
					fifty.run(tests.loader.source);
					fifty.run(tests.loader.closure);
					fifty.run(tests.loader.$export);
				}

				tests.loader.source = function() {
					fifty.run(tests.loader.source.object);
				};

				tests.loader.source.object = function() {
					var api: slime.runtime.Exports = slime.runtime.test.subject;
					verify(api).evaluate(function() { return this.Loader.source.object; }).is.type("function");
					var source = api.loader.source.object({
						a: {
							resource: {
								string: "a"
							}
						},
						b: {
							loader: {
								c: {
									resource: {
										string: "c"
									}
								}
							}
						}
					});
					var readString = function(p: Resource) {
						return p.read(String);
					};
					var loader = new api.Loader(source);
					verify(loader).get("a").evaluate(readString).is("a");
					verify(loader).get("b/c").evaluate(readString).is("c");
					verify(loader).list().length.is(2);
				}

				tests.loader.closure = function() {
					var closure: slime.test.factory = $loader.value("test/data/closure.js");
					var context = { scale: 2 };
					var module = closure(context);
					verify(module).convert(2).is(4);
				};

				tests.loader.$export = function() {
					fifty.run(function module() {
						var module: slime.test.factory = $loader.script("test/data/module-export.js");
						var api = module({ scale: 2 });
						verify(api).convert(3).is(6);
					});

					fifty.run(function file() {
						var file: slime.test.factory = $loader.script("test/data/file-export.js");
						var api = file({ scale: 2 });
						verify(api).convert(3).is(6);
					});
				}
			}
		//@ts-ignore
		)(fifty)

		export interface Exports {
			run: (code: slime.Resource, scope?: { [name: string]: any }, target?: object ) => void
			file: any
			value: any
			Resource: resource.Factory
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

	export interface Codec<T,E> {
		encode: (t: T) => E
		decode: (e: E) => T
	}

	export namespace js {
		export type Cast<T> = (p: any) => T
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
			fifty.run(tests.loader);
		}
	}
//@ts-ignore
)($loader,verify,tests,fifty)
