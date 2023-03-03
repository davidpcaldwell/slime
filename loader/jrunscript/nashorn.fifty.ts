//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.internal.nashorn {
	/**
	 * A `Packages.inonit.script.jsh.Graal.Host` instance, currently, although this should not depend on `jsh` classes. In any case,
	 * none of its methods are currently used, so this is currently an empty interface.
	 */
	export interface Graal extends Engine {
		eval: any
	}

	export interface Scope {
		$graal: Graal
		$loader: slime.jrunscript.native.inonit.script.engine.Loader
	}

	export interface load {
		(location: string): void
		(script: { script: string, name: string })
	}

	export interface Engine {
		script: any
		subshell: any
	}

	export interface Nashorn extends Engine {
		sync: any
	}
}
