//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.external {

}

/**
 * A namespace that contains types defined by the standard `tsc` libraries (`ES5`, `DOM`, etc.; see the
 * [`TSConfig compilerOptions`](https://www.typescriptlang.org/tsconfig#compilerOptions)). They are renamed into
 * `slime.external.lib.*` namespaces here so that they can be used even if shadowed by other types in a particular
 * namespace.
 */
namespace slime.external.lib {
}

/**
 * An implementation-only namespace that is used to define the {@link slime.external.lib} namespaces.
 */
namespace slime.external.lib.rename {
}

namespace slime.external.lib.rename.es5 {
	export type _Function = Function
}

namespace slime.external.lib.rename.dom {
	export type _Console = Console
}

namespace slime.external.lib.es5 {
	export type Function = slime.external.lib.rename.es5._Function
}

namespace slime.external.lib.dom {
	export type Console = slime.external.lib.rename.dom._Console
}

interface Object {
	/** @deprecated Replaced by {@link Object}'s `defineProperty` and related methods. */
	__defineGetter__: Function
}
