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
		if (p.tree) parameters.tree = p.tree;
		var evaluate = (p.evaluate) ? p.evaluate : function(response) {
			var version = response.headers.get("X-Jenkins");
			var string = response.body.stream.character().asString();
			//jsh.shell.echo(JSON.stringify(,void(0),"    "));
			return eval("(" + string + ")");
		};
		return client.request({
			url: (p.fullurl) ? p.fullurl : o.url + p.url,
			parameters: parameters,
			evaluate: evaluate
		});
	}
	
	var BuildRef = function(client,job,json) {
		this.toString = function() {
			return "BuildRef: job=" + job.url + " json=" + JSON.stringify(json);
		};

		this.job = job;
		this.number = json.number;
		this.url = json.url;
		
		this.load = function() {
			return request(client,{ fullurl: json.url + "api/json", depth: "3" });			
		}
	}

	var JobRef = function(client,json) {
		this.url = json.url;
		this.name = json.name;

		this.request = function(p) {
			return request(client,p);
		}

		this.json = json;
		
		var load = function() {
			return request(client,{ fullurl: json.url + "api/json", depth: "2" });			
		}
		
		this.builds = function() {
			return request(client,{ fullurl: json.url + "api/json", tree: "builds[number,timestamp,id,result]" }).builds;
//			var loaded = load();
//			var job = this;
//			return loaded.builds.map(function(json) {
//				return new BuildRef(client,job,json);
//			});
		}

		this.load = function() {
			return load();
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
