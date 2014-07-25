//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME Portable MIME implementation.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Type = function(media,subtype,parameters) {
	$api.Function.argument.isString({ index: 0, name: "media" }).apply(this,arguments);
	$api.Function.argument.isString({ index: 1, name: "subtype" }).apply(this,arguments);
	(function() {
		if (typeof(arguments[2]) != "object" && typeof(arguments[2]) != "undefined") {
			throw new TypeError("arguments[2] (parameters) must be undefined or object");
		}
	}).apply(this,arguments);
	
	this.getMedia = function() {
		return media;
	}

	this.getSubtype = function() {
		return subtype;
	}

	this.getParameters = function() {
		return parameters;
	}

	this.toString = function() {
		var rv = media + "/" + subtype;
		for (var x in parameters) {
			rv += ";" + x + "=\"" + parameters[x] + "\"";
		}
		return rv;
	}
};
$exports.Type.parse = function(string) {
	//	First parse RFC 822 header; see RFC 822 section 3.2 http://tools.ietf.org/html/rfc822#section-3.2
	var collapser = /^(.*)(?:\r\n| |\t){2,}(.*)/;
	while(collapser.test(string)) {
		var match = collapser.exec(string);
		string = match[1] + " " + match[2];
	}
	var slash = string.indexOf("/");
	var media = string.substring(0,slash);
	string = string.substring(slash+1);
	var semicolon = string.indexOf(";");
	var subtype;
	var parameters;
	if (semicolon == -1) {
		subtype = string;
		string = "";
		parameters = {};
	} else {
		subtype = string.substring(0,semicolon);
		string = string.substring(semicolon);
		parameters = {};
		var more = true;
		while(more) {
			//	First, get rid of the semicolon
			if (string.substring(0,1) != ";") {
				throw new Error();
			} else {
				string = string.substring(1);
			}
			//	Then, get rid of whitespace
			var wsmatcher = /^\s+(.*)/;
			if (wsmatcher.test(string)) {
				string = wsmatcher.exec(string)[1];
			}
			var nvmatch = /(.*?)\=(.*)/.exec(string);
			var name = nvmatch[1];
			var rest = nvmatch[2];
			var value = "";
			if (rest.substring(0,1) == "\"") {
				rest = rest.substring(1);
				while(rest.substring(0,1) != "\"") {
					value += rest.substring(0,1);
					rest = rest.substring(1);
				}
				string = rest.substring(1);
			} else {
				while(rest.length > 0 && rest.substring(0,1) != ";") {
					value += rest.substring(0,1);
					rest = rest.substring(1);
				}
				string = rest;
			}
			parameters[name] = value;
			more = (string.length > 0);
		}
		var codes = [];
		for (var i=0; i<string.length; i++) {
			codes.push(string.charCodeAt(i));
		}
		//	loop
	}
	var rv = new $exports.Type(media,subtype,parameters);
	return rv;
}