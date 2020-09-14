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
            (c: C): E
        }

        interface Source {
            Resource?: Resource.Factory
            get: (path: string) => Resource.Descriptor
            child?: any
            list?: any
        }
    }

    namespace runtime {
        interface $engine {
            execute: (script: { name: string, code: string }, scope: object, target: object) => any
            Error?: {
                decorate: any
            }
            Object: {
                defineProperty: {
                    setReadOnly: any
                }
            }
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

        interface $slime {
            getRuntimeScript(path: string): any
            flags: object
            getCoffeeScript(): any
            typescript?: {
                compile: (code: string) => string
            }
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
            typescript: {
                compile: (code: string) => string
            }
            run: any
            file: any
            value: any
            Resource: Resource.Factory
            Loader: {
                new (p: Loader.Source): Loader
                source: any
                series: any
            }
            namespace: any
            java: any
            $platform: $platform
            $api: $api
        }
    }

    type Codec<T,E> = {
        encode: (t: T) => E
        decode: (e: E) => T
    }
}
