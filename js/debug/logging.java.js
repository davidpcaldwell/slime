//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the js/debug SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var _Level = Packages.java.util.logging.Level;

var jlog = function(name,_level) {
	//	TODO	we do not provide a way to log a Throwable in the same way as inonit.system.Logging
	var mask = arguments[2];
	var substitutions = $context.api.java.Array.create({
		array: Array.prototype.slice.call(arguments,3)
	});

	var _logger = Packages.java.util.logging.Logger.getLogger(name);
	if (_logger.isLoggable(_level)) {
		var _message = Packages.java.lang.String.format(mask, substitutions);
		_logger.log(_level, _message);
	}
};

var levels = ["SEVERE","WARNING","INFO","CONFIG","FINE","FINER","FINEST"];

var addLevelsTo = function(object) {
	levels.forEach(function(item) {
		this[item] = function() {
			this.log.apply(this, [_Level[item]].concat(Array.prototype.slice.call(arguments)));
		};
	}, object);
}

var jlogger = function(name) {
	return new function() {
		this.log = function(_level) {
			jlog.apply(null, [name,_level].concat(Array.prototype.slice.call(arguments,1)));
		};

		addLevelsTo(this);
	};
};

$exports.log = function() {
	jlog.apply(null, [$context.prefix, _Level.INFO].concat(Array.prototype.slice.call(arguments)));
};
$exports.log.named = function(name) {
	return jlogger($context.prefix + "." + name);
};