//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.handle = function(request) {
	debugger;
	var resource = httpd.loader.resource(request.path);
	if (resource) {
		return {
			status: {
				code: 200
			},
			headers: [],
			body: {
				type: null,
				stream: resource.read(httpd.io.Streams.binary)
			}
		}
	} else {
		return {
			status: {
				code: 404
			},
			headers: []
		}
	}
};
