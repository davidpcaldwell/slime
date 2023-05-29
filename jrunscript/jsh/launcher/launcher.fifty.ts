//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jsh.launcher {
	export interface Jsh {
		exit: any
		engines: any
		engine: any
		shell: any
		Built: any
		Packaged: any
		Classpath: any
		Unbuilt: new (p: {
			lib: {
				url?: string
				file?: slime.jrunscript.native.java.io.File
			}
			rhino: slime.jrunscript.native.java.net.URL[]
		}) => {
			rhino: slime.jrunscript.native.java.net.URL[]
			graal?: slime.jrunscript.native.java.io.File
			profiler: slime.jrunscript.native.java.io.File
			compileLoader: any
			shellClasspath: () => slime.jrunscript.native.java.net.URL[]
		}
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
