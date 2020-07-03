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
    }

    interface Resource {
        name?: string
        type?: MimeType,
        read?: {
            (p: StringConstructor): string
            (p: JSON): any
            //  XML, XMLList allowed
            (p: any): any
        }
    }

	interface Loader {
		file: any
        module: any
        run: any
        value: any
		Child: {
            (prefix: string): Loader
            new (prefix: string): Loader
        }
		get: (path: string) => Resource
    }

    namespace runtime {
        interface ResourceArgument {
            read: {
                string: () => string
            },
            type: string | MimeType
            name: string
            string?: string
        }

        interface Exports {
            mime: any
            run: any
            file: any
            value: any
            Resource: new (o: ResourceArgument) => slime.Resource
            Loader: any
            namespace: any
            java: any
            $platform: any
            $api: $api
        }
    }
}
