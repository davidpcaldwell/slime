//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.engine {

	/**
	 * A Java object that can load the SLIME Java runtime.
	 *
	 * See [Loader.java]({@link ./Loader.java}). (file://./Loader.java}
	 */
	export interface Loader {
		//	TODO	rename to inonit.script.engine.Runtime? Or something clearer? Maybe rename methods to getSlimeRuntimeCode() and
		//			getCoffeeScriptCode()?

		/**
		 * Loads a SLIME runtime source file.
		 *
		 * @param path A path, relative to `loader/`, of a SLIME runtime source file.
		 *
		 * @returns The source code at the given location.
		 */
		getLoaderCode: (path: string) => slime.jrunscript.native.java.lang.String

		getClasspath: () => Loader.Classes.Interface

		/**
		 * A function that provides access to CoffeeScript, if available.
		 *
		 * @returns The source code for CoffeeScript, or `null` if it is not present.
		 */
		getCoffeeScript: () => slime.jrunscript.native.java.lang.String

		/**
		 * Returns a {@link Loader.Typescript} if one is available; otherwise returns `null`.
		 */
		getTypescript: () => Loader.Typescript
	}

	export namespace Loader {
		export namespace Classes {
			export interface Interface {
				setAsThreadContextClassLoaderFor: (_thread: slime.jrunscript.native.java.lang.Thread) => void
				getClass: (name: string) => slime.jrunscript.native.java.lang.Class
				add: (argument: slime.jrunscript.native.inonit.script.engine.Code.Loader) => void
				addJar: (argument: slime.jrunscript.native.java.io.File) => void
				compiling: (argument: slime.jrunscript.native.inonit.script.engine.Code.Loader) => slime.jrunscript.native.inonit.script.engine.Code.Loader
			}
		}

		export interface Typescript {
			compile: (code: string) => slime.jrunscript.native.java.lang.String
		}
	}
}
