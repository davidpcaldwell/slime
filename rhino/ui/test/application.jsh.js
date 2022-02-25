//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var servlet = {
	load: function(scope) {
		scope.$exports.handle = function(request) {
			var host;
			try {
				host = request.headers.get("host");
			} catch (e) {
				for (var i=0; i<request.headers.length; i++) {
					if (request.headers[i].name.toLowerCase() == "host") {
						host = request.headers[i].value;
					}
				}
			}
			return {
				status: { code: 200 },
				body: {
					type: "text/plain",
					string: JSON.stringify({
						method: request.method,
						host: host,
						path: request.path
					},void(0),"    ")
				}
			}
		};
	}
};

jsh.script.Application.run({
	commands: {
		chrome: {
			getopts: {
				options: {
					host: String
				}
			},
			run: function(parameters) {
				//	This call will not return; default on.close() will terminate the VM
				jsh.ui.application({
					servlet: servlet,
					browser: {
						host: parameters.options.host,
						chrome: {}
					}
				});
			}
		}
		,
		javafx: {
			getopts: {
				options: {
					zoom: Number
				}
			},
			run: function(parameters) {
				jsh.ui.application({
					servlet: servlet,
					browser: {
						zoom: parameters.options.zoom
					}
				})
			}
		}
	}
})
