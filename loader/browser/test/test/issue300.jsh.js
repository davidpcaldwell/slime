//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var suite = new jsh.unit.Suite(new jsh.unit.html.Part({
	pathname: jsh.script.file.parent.parent.getRelativePath("suite.jsh.api.html")
}));

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
