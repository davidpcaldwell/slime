//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jsh.launcher {
	export interface Installation {
		rhino: slime.jrunscript.native.java.net.URL[]
		nashorn: slime.jrunscript.native.java.net.URL[]
		graal?: slime.jrunscript.native.java.io.File
		profiler: slime.jrunscript.native.java.io.File
		shellClasspath: () => slime.jrunscript.native.java.net.URL[]
	}

	export interface Jsh {
		exit: any
		engines: any
		engine: any
		shell: any
		Packaged: any
		Classpath: any

		Unbuilt: new (p: {
			lib: {
				url?: string
				file?: slime.jrunscript.native.java.io.File
			}
			rhino: slime.jrunscript.native.java.net.URL[]
			nashorn: slime.jrunscript.native.java.net.URL[]
		}) => Installation & {
			compileLoader: any
		}

		Built: new (p: slime.jrunscript.native.java.io.File) => Installation
	}

	interface Additions {
		slime: slime.internal.jsh.launcher.Slime
		jsh: slime.internal.jsh.launcher.Jsh
	}

	interface JavaAdditions {
		compile: slime.internal.jsh.launcher.javac.compile
	}

	export type Global = slime.internal.jrunscript.bootstrap.Global<Additions,JavaAdditions>
}
