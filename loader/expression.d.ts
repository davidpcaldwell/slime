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
    interface MimeType {
        getMedia(): string
        getSubtype(): string
        getParameters(): { [x: string]: string }
        is(string: string): boolean
        toString(): string
    }

    interface Resource {
        name: string
        type: MimeType,
        read?: {
            (p: StringConstructor): string
            (p: JSON): any
            //  XML, XMLList allowed
            (p: any): any
        }
    }

    namespace Resource {
        interface Descriptor {
            type?: string | MimeType
            name?: string
            read: {
                string?: () => string
            },
            string?: string
        }

        type Factory = new (o: Descriptor) => slime.Resource
    }

	interface Loader {
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

    namespace Loader {
        interface Product<C,E> {
            (c?: C): E
        }

        interface Source {
            Resource?: Resource.Factory
            get: (path: string) => Resource.Descriptor
            child?: any
            list?: any
        }

        interface Scope {
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
     * [Older documentation](../../../../loader/api.html)
     */
    namespace runtime {
        namespace $slime {
            interface TypeScript {
                compile: (code: string) => string
            }

            interface CoffeeScript {
                compile: (code: string) => string
            }
        }

        /**
         * An object providing access to the SLIME execution environment.
         */
        interface $slime {
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

        /**
         * The `$engine` object can be provided in the scope by the embedding in order to provide additional capabilities the
         * JavaScript engine may have.
         */
        interface $engine {
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

        interface $platform {
            execute: (code: { name?: string, js: string }, scope: { [x: string]: any }, target: any) => any
            Object: {
                defineProperty: {
                    ecma?: boolean
                    accessor?: boolean
                }
            }
            Error: {
                decorate?: <T>(errorConstructor: T) => T
            }
            e4x: any
            MetaObject: any
            java: any
        }

        interface Scope {
            $platform: $platform
            $api: $api
        }

        interface Exports {
            mime: {
                Type: {
                    new (media: string, subtype: string, parameters: { [x: string]: string }): MimeType
                    parse: (string: string) => MimeType
                    fromName: (path: string) => MimeType
                }
            }
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

            readonly typescript: TypeScript
        }
    }

    type Codec<T,E> = {
        encode: (t: T) => E
        decode: (e: E) => T
    }
}
