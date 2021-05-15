//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Untested because it is currently unsupported
if ($slime.getSystemProperty("cygwin.root") || $slime.getSystemProperty("cygwin.paths")) {
	context.cygwin = {
		root: $slime.getSystemProperty("cygwin.root"),
		paths: $slime.getSystemProperty("cygwin.paths")
	}
}
