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
		Unbuilt: any
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