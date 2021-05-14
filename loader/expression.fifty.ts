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
             * Each property of the object represents a MIME type
             * parameter of the form *`name`*=*`value`*.
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
        factory: <C,E>(path: string) => loader.Product<C,E>
		Child: {
            (prefix: string): Loader
        }
        get: (path: string) => Resource
        list?: (m?: { filter?: any, descendants?: any }) => any[]
    }

    export namespace loader {
        export interface Product<C,E> {
            (c?: C): E
        }

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

        export namespace internal {
            export type LoaderConstructor = new (p: loader.Source) => Loader
            export type Resource = resource.Factory
            export type methods = {
                run: any
            }
            export type createFileScope = <T>($context: T) => {
                $context: T
                $export: any
                $exports: any
            }
            export type mime = {
                Type: Exports["mime"]["Type"],
                mimeTypeIs: (type: string) => (type: slime.mime.Type) => boolean
            }

            export type scripts = {
                methods: {
                    run: (code: slime.Resource, scope: { [name: string]: any }) => void
                    value: (code: slime.Resource, scope: { [name: string]: any }) => any
                    file: (code: slime.Resource, context: { [name: string]: any }) => { [x: string]: any }
                }
                toExportScope: slime.runtime.Exports["Loader"]["tools"]["toExportScope"]
                createFileScope: createFileScope
            }

            /**
             * An internal object derived from {@link slime.runtime.$engine} which adds default implementations.
             */
            export interface $engine {
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
                    var $slime = {
                        getRuntimeScript: function(path) {
                            var resource = fifty.$loader.get(path);
                            return { name: resource.name, js: resource.read(String) }
                        }
                    };
                    var $engine = void(0);
                    return eval(js);
                })();

                return subject;
            //@ts-ignore
            })(fifty)
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
                    (media: string, subtype: string, parameters?: { [x: string]: string }): mime.Object

                    /**
                     * Parses the given string, returning the appropriate MIME type object.
                     *
                     * @param string A MIME type.
                     */
                    parse(string: string): mime.Object

                    /**
                     * Attempts to determine the MIME type of a resource given its name.
                     *
                     * @param path A resource name.
                     * @returns The type determined from the name, or `undefined` if the type cannot be determined.
                     */
                    fromName(path: string): mime.Type

                    /**
                     * Converts a MIME type to a string, suitable for a MIME type declaration.
                     */
                    toDeclaration(mimeType: mime.Type): string
                }
            }
        }

        (
            function(
                fifty: slime.fifty.test.kit
            ) {
                fifty.tests.runtime.exports.mime = function() {
                    var subject: slime.runtime.Exports = slime.runtime.test.subject;

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
                    toExportScope: <T>(t: T) => T & { $export: any, $exports: any }
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
                    run(tests.loader.source);
                    run(tests.loader.closure);
                    run(tests.loader.$export);
                }

                tests.loader.source = function() {
                    run(tests.loader.source.object);
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
                    var readString = function(p) {
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
                    run(function module() {
                        var module: slime.test.factory = $loader.factory("test/data/module-export.js");
                        var api = module({ scale: 2 });
                        verify(api).convert(3).is(6);
                    });

                    run(function file() {
                        var file: slime.test.factory = $loader.factory("test/data/file-export.js");
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

            readonly typescript: slime.runtime.$slime.TypeScript
        }
    }

    export interface Codec<T,E> {
        encode: (t: T) => E
        decode: (e: E) => T
    }
}

namespace slime.test {
    declare type api = { convert: (input: number) => number };
    export type factory = slime.loader.Product<{ scale: number }, api>;
}

(
	function(
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: any
	) {
		tests.suite = function() {
			run(tests.loader);
			run(tests.runtime.exports.mime);
		}
	}
//@ts-ignore
)($loader,verify,tests)
