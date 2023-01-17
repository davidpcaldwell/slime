//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.engine {
	export interface Loader {
		getCoffeeScript()
		getTypescript()
		getClasspath(): any
		getLoaderCode(path: string): any
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
	}
}
