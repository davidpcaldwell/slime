//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var firebase = httpd.loader.value("WEB-INF/db/firebase/slim/server.js", {
	httpd: httpd,
	rest: rest
});

$exports.handle = function(request) {
	var fb = firebase.handle(request);
	if (fb) return fb;
};

$exports.Service = function(references) {
	this.firebase = rest.Service(new firebase.Service(references));
};
