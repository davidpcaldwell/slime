//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	/**
	 * Allows the runtime marking of particular API constructs. These APIs can execute a globally specified callback,
	 * specified by this object's `warning` property, upon accesses.
	 *
	 * This function is overloaded, and supports a version that marks named properties of objects, and a version that deprecates
	 * functions.
	 */
	export interface Flagger {
		/**
		 * A function that can be used to flag a particular function.
		 *
		 * @param f A function to mark
		 * @returns A marked version of the function that invokes the `Flagger`'s callback for each access
		 */
		<T extends slime.external.lib.es5.Function>(f: T): T

		/**
		 * A function that can be used to flag a named property on an object.
		 *
		 * @param o A target object whose property will be marked.
		 * @param property The name of the property to mark. If omitted, <strong>all</strong> properties will be marked.
		 */
		(o: object, property?: string): void

		warning: (o: any) => void
	}

	export interface Global {
		/**
		 * Allows the runtime deprecation of particular API constructs.
		 */
		deprecate: Flagger

		/**
		 * Allows the runtime marking of particular API constructs as experimental.
		 */
		experimental: Flagger
	}
}
