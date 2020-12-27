interface Object {
	__defineGetter__: Function
}

//	Copied from https://github.com/microsoft/TypeScript/blob/master/lib/lib.es2015.core.d.ts
interface ObjectConstructor {
	/**
	 * Copy the values of all of the enumerable own properties from one or more source objects to a
	 * target object. Returns the target object.
	 * @param target The target object to copy to.
	 * @param source The source object from which to copy properties.
	 */
	assign<T, U>(target: T, source: U): T & U;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     */
    assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     * @param source3 The third source object from which to copy properties.
     */
    assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param sources One or more source objects from which to copy properties
     */
    assign(target: object, ...sources: any[]): any;
}

//	Copied from https://github.com/microsoft/TypeScript/blob/master/lib/lib.es2017.object.d.ts
interface ObjectConstructor {
    /**
     * Returns an array of key/values of the enumerable properties of an object
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];

    /**
     * Returns an array of key/values of the enumerable properties of an object
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    entries(o: {}): [string, any][];
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

//	Copied from https://github.com/microsoft/TypeScript/blob/master/lib/lib.es2019.object.d.ts
interface ObjectConstructor {
    /**
     * Returns an object created by key-value entries for properties and methods
     * @param entries An iterable object that contains key-value entries for properties and methods.
     */
    fromEntries<T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T };

    /**
     * Returns an object created by key-value entries for properties and methods
     * @param entries An iterable object that contains key-value entries for properties and methods.
     */
    fromEntries(entries: Iterable<readonly any[]>): any;
}

//	Copied from https://github.com/microsoft/TypeScript/blob/master/lib/lib.es2015.core.d.ts
interface Array<T> {
    /**
     * Returns the value of the first element in the array where predicate is true, and undefined
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found, find
     * immediately returns that element value. Otherwise, find returns undefined.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    find<S extends T>(predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
}

namespace slime {
    /**
     * A MIME type.
     */
    export interface MimeType {
        /**
         * The MIME media type for this type; for `text/plain`, `"text"`.
         */
        media: string

        /**
         * The MIME subtype for this type; for `text/plain`, `"plain"`.
         */
        subtype: string

        /**
         * Each property of the object represents a MIME type
         * parameter of the form *`name`*=*`value`*.
         */
        parameters: { [x: string]: string }
    }

    export namespace MimeType {
        /**
         * @deprecated
         */
        export interface Object extends MimeType {
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
        type: MimeType,
        read?: {
            (p: StringConstructor): string
            (p: JSON): any
            //  XML, XMLList allowed
            (p: any): any
        }
    }

    export namespace Resource {
        export interface Descriptor {
            type?: string | MimeType
            name?: string
            read?: {
                string?: () => string
            },
            string?: string
        }

        export type Factory = new (o: Descriptor) => slime.Resource
    }

	export interface Loader {
        source: Loader.Source
        run: (path: string, scope?: any, target?: any) => void
        value: (path: string, scope?: any, target?: any) => any
		file: (path: string, $context?: any, target?: any) => any
        module: (path: string, $context?: any, target?: any) => any
        factory: <C,E>(path: string) => Loader.Product<C,E>
		Child: {
            (prefix: string): Loader
            new (prefix: string): Loader
        }
        get: (path: string) => Resource
        list?: (m?: { filter?: any, descendants?: any }) => any[]
    }

    export namespace Loader {
        export interface Product<C,E> {
            (c?: C): E
        }

        export interface Source {
            Resource?: Resource.Factory
            get: (path: string) => Resource.Descriptor
            child?: any
            list?: any
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
     * they must supply a value for `$slime` that is a {@link $slime} object that provides information about the SLIME installation.
     *
     * The runtime will in turn supply embeddings with an {@link $api} object, providing a basic set of JavaScript utilities, and a
     * {@link $platform} object, providing more advanced JavaScript engine capabilities that depend on the underlying JavaScript
     * engine.
     *
     * All code loaded by the SLIME runtime has access to the {@link $api} object (as `$api`) and the
     * {@link $platform} object (as `$platform`).
     *
     * [Older documentation](../../../../loader/api.html)
     */
    export namespace runtime {
        export namespace $slime {
            export interface TypeScript {
                compile: (code: string) => string
            }

            export interface CoffeeScript {
                compile: (code: string) => string
            }
        }

        /**
         * An object providing access to the SLIME execution environment.
         */
        export interface $slime {
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
                object?: slime.runtime.$slime.CoffeeScript
            }

            typescript?: slime.runtime.$slime.TypeScript
        }

        /**
         * The `$engine` object can be provided in the scope by the embedding in order to provide additional capabilities the
         * JavaScript engine may have.
         */
        export interface $engine {
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
                    code: string
                },
                scope: { [x: string]: any },
                target: object
            ): any

            /**
             * A constructor that implements the behavior defined by {@link $platform.MetaObject}.
             */
            MetaObject: any
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

        interface Scope {
            $platform: $platform
            $api: $api
        }

        export interface Exports {
            /**
             * Provides APIs relating to MIME types.
             */
            mime: {
                Type: {
                    /**
                     * Creates a MIME type from its parsed components.
                     *
                     * @param media The MIME media type: for `text/plain`, `"text"`.
                     * @param subtype The MIME subtype: for `text/plain`, `"plain"`.
                     * @param parameters Each property of the object represents a MIME parameter that
                     * will be appended to the MIME type; the name of the property is the name of the parameter, while the value of the property is the
                     * value of the parameter.
                     */
                    (media: string, subtype: string, parameters?: { [x: string]: string }): MimeType.Object

                    /**
                     * Parses the given string, returning the appropriate MIME type object.
                     *
                     * @param string A MIME type.
                     */
                    parse(string: string): MimeType.Object

                    /**
                     * Attempts to determine the MIME type of a resource given its name.
                     *
                     * @param path A resource name.
                     * @returns The type determined from the name, or `undefined` if the type cannot be determined.
                     */
                    fromName(path: string): MimeType

                    /**
                     * Converts a MIME type to a string, suitable for a MIME type declaration.
                     */
                    toDeclaration(mimeType: MimeType): string
                }
            }
        }

        export interface Exports {
            run: any
            file: any
            value: any
            Resource: Resource.Factory
            Loader: {
                new (p: Loader.Source): Loader
                source: any
                series: any
                tools: any
            }
            namespace: any
            $platform: $platform
            java?: any
            $api: $api

            readonly typescript: slime.runtime.$slime.TypeScript
        }
    }

    export type Codec<T,E> = {
        encode: (t: T) => E
        decode: (e: E) => T
    }
}

declare type api = { convert: (input: number) => number };
declare type factory = slime.Loader.Product<{ scale: number }, api>;

(
	function(fifty: slime.fifty.test.kit) {
		fifty.tests.runtime = {};
		fifty.tests.runtime.exports = {};
	}
//@ts-ignore
)(fifty);

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.runtime.exports.mime = function() {
			var code = fifty.$loader.get("expression.js");
			var js = code.read(String);
			fifty.verify(js).is.type("string");

			var subject: slime.runtime.Exports = (function() {
				var $slime = {
					getRuntimeScript: function(path) {
						var resource = fifty.$loader.get(path);
						return { name: resource.name, js: resource.read(String) }
					}
				};
				var $engine = void(0);
				return eval(js);
			})();

			fifty.verify(subject).mime.is.type("object");

			var verify = fifty.verify;

			run(function parse() {
				var string = "text/plain";
				var type = subject.mime.Type.parse(string);
				verify(type).media.is("text");
				verify(type).subtype.is("plain");
				verify(type).parameters.is.type("object");
				verify(type).parameters.evaluate(function(p) { return Object.keys(p); }).length.is(0);
			});

			run(function fromName() {
			 	verify(subject.mime).Type.fromName("foo.js").evaluate(function(p) { return p.toString() }).is("application/javascript");
			 	verify(subject.mime).Type.fromName("foo.f").is(void(0));
			});

			//	TODO	According to RFC 2045 section 5.1, matching is case-insensitive
			//			https://tools.ietf.org/html/rfc2045#section-5
			//
			//			types, subtypes, and parameter names are case-insensitive
			//			parameter values are "normally" case-sensitive
			//
			//			TODO	comments are apparently allowed as well, see 5.1
			//
			//			TODO	quotes are also apparently not part of parameter values

			run(function constructorArguments() {
				verify(subject.mime).evaluate(function() {
					return subject.mime.Type(void(0), "plain");
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type(null, "plain");
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", void(0));
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", null);
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					//@ts-expect-error
					return subject.mime.Type("text", "plain", 2);
				}).threw.type(Error);

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain");
				}).threw.nothing();

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain").toString();
				}).is("text/plain");

				verify(subject.mime).evaluate(function() {
					return subject.mime.Type("text", "plain", { charset: "us-ascii" }).toString();
				}).is("text/plain; charset=\"us-ascii\"");
			});
		}
	}
//@ts-ignore
)(fifty);

(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: any
	) {
		tests.loader = {};

		tests.loader.closure = function() {
			var closure: factory = $loader.value("test/data/closure.js");
			var context = { scale: 2 };
			var module = closure(context);
			verify(module).convert(2).is(4);
		};

		tests.loader.$export = function() {
			var file: factory = $loader.factory("test/data/module-export.js");
			var api = file({ scale: 2 });
			verify(api).convert(3).is(6);
		}

		tests.suite = function() {
			run(tests.loader.closure);
			run(tests.runtime.exports.mime);
		}
	}
//@ts-ignore
)($loader,verify,tests)
