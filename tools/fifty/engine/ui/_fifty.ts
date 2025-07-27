//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Types related to a **currently-inactive** project to build a custom UI for serving Fifty definitions (and perhaps running their
 * tests). See {@link https://github.com/davidpcaldwell/slime/projects/11 | the closed GitHub project}.
 */
namespace slime.fifty.ui {
	export interface Exports {
		ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object

		interpret: (p: { ast: object }) => object
	}
}
