//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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

//	Copied from https://github.com/microsoft/TypeScript/blob/master/lib/lib.es2017.object.d.ts
interface ObjectConstructor {
    /**
     * Returns an array of values of the enumerable properties of an object
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
     values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];

     /**
      * Returns an array of values of the enumerable properties of an object
      * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
      */
     values(o: {}): any[];
}

interface String {
    //  Copied from https://github.com/microsoft/TypeScript/blob/main/lib/lib.es2015.core.d.ts
    /**
     * Returns true if the sequence of elements of searchString converted to a String is the
     * same as the corresponding elements of this object (converted to a String) starting at
     * endPosition – length(this). Otherwise returns false.
     */
    endsWith(searchString: string, endPosition?: number): boolean;
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

    /**
     * Returns the index of the first element in the array where predicate is true, and -1
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found,
     * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
}

(
    function(
        fifty: slime.fifty.test.Kit
    ) {
        const console = (fifty.global.jsh) ? fifty.global.jsh.shell.console : fifty.global.window["console"].log;

        fifty.tests.suite = function() {
            var url = new URL("https://user:pass@example.com:8080/a/b?q=1#frag");
            fifty.verify(url).protocol.is("https:");
            fifty.verify(url).username.is("user");
            fifty.verify(url).password.is("pass");
            fifty.verify(url).host.is("example.com:8080");
            fifty.verify(url).hostname.is("example.com");
            fifty.verify(url).port.is("8080");
            fifty.verify(url).pathname.is("/a/b");
            fifty.verify(url).search.is("?q=1");
            fifty.verify(url).hash.is("#frag");
            fifty.verify(url).origin.is("https://example.com:8080");
            fifty.verify(url).href.is("https://user:pass@example.com:8080/a/b?q=1#frag");
            fifty.verify(url).evaluate(function(p) { return p.toString(); }).is("https://user:pass@example.com:8080/a/b?q=1#frag");

            //  A URL with no explicit path is normalized to "/"
            fifty.verify(new URL("https://example.com")).pathname.is("/");
            fifty.verify(new URL("https://example.com")).href.is("https://example.com/");

            //  Relative resolution against a base, per https://tools.ietf.org/html/rfc3986#section-5.3
            var base = "https://example.com/a/b/c";
            fifty.verify(new URL("../d", base)).href.is("https://example.com/a/d");
            fifty.verify(new URL("/d", base)).href.is("https://example.com/d");
            fifty.verify(new URL("?x=1", base)).href.is("https://example.com/a/b/c?x=1");
            fifty.verify(new URL("#section", base)).href.is("https://example.com/a/b/c#section");
            fifty.verify(new URL("//other.example.com/d", base)).href.is("https://other.example.com/d");

            //  Setters re-serialize `href`
            var mutable = new URL("https://example.com/a");
            mutable.pathname = "/b";
            mutable.search = "x=1";
            mutable.hash = "y";
            fifty.verify(mutable).href.is("https://example.com/b?x=1#y");

            //  A URL with neither an explicit scheme nor a base is invalid
            fifty.verify(0).evaluate(function() {
                return new URL("/a/b");
            }).threw.type(TypeError);
        }

        fifty.tests.manual = {};

        //  Rhino 1.8.0: natively supports all
        //  Rhino 1.7.15: untested
        //  Nashorn 15.6: supports only Object.defineProperty, but does support it all the way back to Java 8

        fifty.tests.manual.engine = function() {
            if (fifty.global.jsh) {
                fifty.global.jsh.shell.console("java version = " + fifty.global.jsh.shell.java.version);
                var rhino = fifty.global.jsh.internal.bootstrap.engine.rhino.running();
                if (rhino) {
                    fifty.global.jsh.shell.console("Rhino version " + rhino.getImplementationVersion());
                }
            }

            //  Polyfilled methods; toString() tells us whether implementations are native or polyfilled.
            console("Object.defineProperty: " + Object.defineProperty);
            console("Object.assign: " + Object.assign);
            console("Object.fromEntries: " + Object.fromEntries);
            console("Object.entries: " + Object.entries);
            console("Object.values: " + Object.values);
            console("String.prototype.endsWith: " + String.prototype.endsWith);
            console("Array.prototype.find: " + Array.prototype.find);
            console("Array.prototype.findIndex: " + Array.prototype.findIndex);
            console("Map: " + Map);

            //  Methods not polyfilled yet, so we log the implementations by directly accessing properties of the global object.
            var global = (function() { return this; })();
            console("URL: " + global.URL);
        }
    }
//@ts-ignore
)(fifty);
