//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export interface Libraries {
		/**
		 * The classpath for the Java-version-appropriate version of Rhino.
		 */
		rhino: (jdkMajorVersion: number) => {
			local: () => slime.jrunscript.native.java.net.URL[]
			download: () => slime.jrunscript.native.java.net.URL[]
		}

		nashorn: slime.jrunscript.native.java.net.URL[]
	}

	export interface Installation {
		toString: () => string

		libraries?: Libraries
		packaged?: slime.jrunscript.native.java.io.File
		home?: slime.jrunscript.native.java.io.File

		graal?: slime.jrunscript.native.java.io.File
		profiler?: slime.jrunscript.native.java.io.File
		shellClasspath: (p?: { source: number, target: number }) => slime.jrunscript.native.java.net.URL[]
	}

	export interface Engine {
		/**
		 * The name of the `jsh` main class for this engine.
		 */
		main: string
	}

	export interface Jsh {
		engines: slime.internal.jrunscript.bootstrap.PerEngine<Engine>
	}

	export interface Jsh {
		exit: any
	}

	export interface Jsh {
		Classpath: any

		Unbuilt: (p: {
			src?: Source
			lib?: {
				url?: string
				file?: slime.jrunscript.native.java.io.File
			}
			//	If Rhino was explicitly provided via a jsh setting
			rhino: slime.jrunscript.native.java.net.URL[]
		}) => Installation & {
			compileLoader: (p?: {
				to?: slime.jrunscript.native.java.io.File
				source?: number
				target?: number
			}) => slime.jrunscript.native.java.io.File
		}

		Built: (p: slime.jrunscript.native.java.io.File) => Installation

		Packaged: (p: slime.jrunscript.native.java.io.File) => Installation

		shell?: {
			packaged?: string
			rhino: any
			classpath: any
			current: Installation
		}

		//	TODO: Set in main.js
		current?: {
			installation?: Installation
		}
	}

	export interface Additions {
		slime: slime.jsh.internal.launcher.Slime
		jsh: slime.jsh.internal.launcher.Jsh
	}

	export interface JavaAdditions {
	}

	export type Global = slime.internal.jrunscript.bootstrap.Global<Additions,JavaAdditions>
}
