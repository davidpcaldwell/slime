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
	export type _Date = Date
	export type _ObjectConstructor = ObjectConstructor
	export type _Object = Object
}

namespace slime.external.lib.rename.dom {
	export type _Console = Console
}

namespace slime.external.lib.rename.typescript {
	export type _Partial<T> = Partial<T>
}

namespace slime.external.lib.es5 {
	export type Function = (...args: any) => any

	/**
	 * For some reason, TypeScript declares utility types like `Parameters` and `ReturnType` to refer to this, rather than its
	 * own `Function` definition. So we reproduce this type for reuse when generically specifying functions and using those utility
	 * types.
	 */
	export type TypescriptFunction = (...args: any[]) => any

	export type Date = slime.external.lib.rename.es5._Date
	export type Object = slime.external.lib.rename.es5._Object
	export type ObjectConstructor = slime.external.lib.rename.es5._ObjectConstructor
}

namespace slime.external.lib.dom {
	export type Console = slime.external.lib.rename.dom._Console
}

namespace slime.external.lib.typescript {
	export type Partial<T> = slime.external.lib.rename.typescript._Partial<T>
}

interface Object {
	/** @deprecated Replaced by {@link Object}'s `defineProperty` and related methods. */
	__defineGetter__: Function

	/** @deprecated Replaced by {@link Object}'s `defineProperty` and related methods. */
	__defineSetter__: Function
}
