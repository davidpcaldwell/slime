//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var slime = new jsh.file.Loader({ 
	directory: $mapping.getRelativePath("../../../../..").directory
});

var NoLocalSource = function(was) {
	this.toString = function() {
		return "NoLocalSource: [" + was.toString() + "]";
	};

	this.get = function(path) {
		return was.get(path);
	};

	this.list = function(prefix) {
		var rv = was.list(prefix);
		if (!prefix) rv = rv.filter(function(item) {
			return item.path != "local";
		});
		rv = rv.filter(function(item) {
			return item.path != ".hg";
		});
		return rv;
	}
};

var loader = new jsh.io.Loader(new NoLocalSource(slime.source));

add({
	prefix: "WEB-INF/slime/", 
	loader: loader
});
