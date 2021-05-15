//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

export interface TypescriptTestContext {
	prefix: string
}

interface TypescriptTestExports {
	foo: String
}

declare var $context : TypescriptTestContext
declare var $exports : TypescriptTestExports

var person : string = "Foo";

$exports.foo = $context.prefix + "bar"
