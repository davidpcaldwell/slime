//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var getMirror = function() {
	return $context.client.request({
		url: "http://www.apache.org/dyn/closer.cgi?asjson=1",
		evaluate: function(response) {
			var json = eval("(" + response.body.stream.character().asString() + ")");
			return json.preferred;
		}
	});
}

$exports.get = function(path) {
	var url = getMirror() + path;
	jsh.shell.echo("Downloading from " + url + " ...");
	return $context.client.request({
		url: url
	});
};

$exports.download = function(p) {
	var name = p.path.split("/").slice(-1)[0];
	if ($context.api.downloads && $context.api.downloads.getFile(name)) {
		return $context.api.download({
			name: name
		});
	} else {
		return $context.api.download({
			url: getMirror() + p.path
		});
	}
};

$exports.find = function(p) {
	
}
