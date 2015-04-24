//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Console = function(p) {
	this.start = function(scenario) {
		p.send({ start: { scenario: { name: scenario.name } } });
	};

	var jsonError = function(error) {
		if (error) {
			return {
				type: error.type,
				message: error.message,
				stack: error.stack
			}
		} else {
			return void(0);
		}
	}

	this.test = function(result) {
		p.send({
			test: {
				success: result.success,
				message: result.message,
				error: jsonError(result.error)
			}
		});
	}

	this.end = function(scenario,success) {
		p.send({ end: { scenario: { name: scenario.name }, success: success }});
	}
};
