//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher.javac {
	export type compile = (p: {
		files: slime.jrunscript.native.java.net.URL[]
		destination: slime.jrunscript.native.java.io.File
		classpath: slime.jrunscript.native.java.net.URL[]
	}) => void
}
