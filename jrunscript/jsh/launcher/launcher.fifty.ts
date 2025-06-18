//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export interface Installation {
		toString: () => string

		/**
		 * The classpath from which Rhino can be loaded, or `null`/`undefined` if it is not present.
		 */
		rhino: slime.jrunscript.native.java.net.URL[]

		nashorn: slime.jrunscript.native.java.net.URL[]
		graal?: slime.jrunscript.native.java.io.File
		profiler: slime.jrunscript.native.java.io.File
		shellClasspath: (p?: { source: string, target: string }) => slime.jrunscript.native.java.net.URL[]
	}

	export interface Engine {
		/**
		 * The name of the `jsh` main class for this engine.
		 */
		main: string

		resolve: <T>(engines: { [name: string]: T }) => T
	}

	export interface Jsh {
		exit: any
		engines: {
			rhino: Engine
			nashorn: Engine
			graal: Engine
		}
		engine: any
		shell: any
		Packaged: any
		Classpath: any

		Unbuilt: (p: {
			lib: {
				url?: string
				file?: slime.jrunscript.native.java.io.File
			}
			rhino: slime.jrunscript.native.java.net.URL[]
			nashorn: slime.jrunscript.native.java.net.URL[]
		}) => Installation & {
			compileLoader: any
		}

		Built: (p: slime.jrunscript.native.java.io.File) => Installation
	}

	interface Additions {
		slime: slime.jsh.internal.launcher.Slime
		jsh: slime.jsh.internal.launcher.Jsh
	}

	interface JavaAdditions {
		compile: slime.jsh.internal.launcher.javac.compile
	}

	export type Global = slime.internal.jrunscript.bootstrap.Global<Additions,JavaAdditions>
}
