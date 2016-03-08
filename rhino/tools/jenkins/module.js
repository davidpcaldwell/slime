//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Server = function(o) {
	var client = new jsh.http.Client();

	this.request = function(p) {
		return client.request({
			url: o.url + p.url,
			parameters: p.parameters,
			evaluate: function(response) {
				return eval("(" + response.body.stream.character().asString() + ")");
			}
		});
	};
	
	var request = function(client,p) {
		var parameters = jsh.js.Object.set({}, (p.parameters) ? p.parameters : {});
		if (p.depth) parameters.depth = p.depth;
		var evaluate = (p.evaluate) ? p.evaluate : function(response) {
			return eval("(" + response.body.stream.character().asString() + ")");
		};
		return client.request({
			url: (p.fullurl) ? p.fullurl : o.url + p.url,
			parameters: p.parameters,
			evaluate: evaluate
		});
	}
	
	var JobRef = function(client,json) {
		this.url = json.url;
		
		this.request = function(p) {
			return request(client,p);
		}
		
		this.json = json;
		
		this.load = function() {
			return request(client,{ fullurl: json.url + "api/json", depth: "2" });
		}
	}
	
	this.Session = function(s) {
		var c = {};
		
		if (s && s.credentials) {
			c.authorization = new jsh.http.Authentication.Basic.Authorization(s.credentials);
		}
		
		var client = new jsh.http.Client(c);
		
		this.request = function(p) {
			return request(client,p);
		};
		
		this.api = function() {
			var rv = request(client,{
				url: "api/json"
			});
			rv.jobs = rv.jobs.map(function(json) {
				return new JobRef(client,json);
			});
			return rv;
		}
	}
};
