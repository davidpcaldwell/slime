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

var jlog = function(name,_level,_message) {
	//	TODO	we do not provide a way to log a Throwable in the same way as inonit.system.Logging
	Packages.java.util.logging.Logger.getLogger(name).log(_level, _message, $context.api.java.Array.create({
		array: Array.prototype.slice.call(arguments,3)
	}));
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

$exports.log.initialize = function(o) {
	if (typeof(o) == "function") {
		var _manager = Packages.java.util.logging.LogManager.getLogManager();
		var _root = _manager.getLogger("");
		_root.setLevel(Packages.java.util.logging.Level.FINEST);
		var _handler = new JavaAdapter(
			Packages.java.util.logging.Handler,
			new function() {
				this.close = function() {
				};

				this.flush = function() {
				};

				this.publish = function(_record) {
					var parameters = (_record.getParameters()) ? $context.api.java.Array.adapt(_record.getParameters()) : null;
					var record = {
						level: {
							name: String(_record.getLevel().getName())
						},
						logger: {
							name: String(_record.getLoggerName())
						},
//						message: String(_record.getMessage()),
						timestamp: Number(_record.getMillis()),
						//	TODO	re-insert, probably with formatting
//						parameters: parameters,
						//	resource bundle
						//	resource bundle name
						sequence: Number(_record.getSequenceNumber()),
						source: new function() {
							this["class"] = { name: String(_record.getSourceClassName()) };
							this["method"] = { name: String(_record.getSourceMethodName()) };
						},
						thread: {
							id: Number(_record.getThreadID())
						}
					};
					Object.defineProperty(record, "message", {
						get: function() {
							//	TODO	memoize
							var _parameters = _record.getParameters();
							if (_parameters) {
								return String( Packages.java.lang.String.format(_record.getMessage(), _parameters) );
							} else {
								return String(_record.getMessage());
							}
						},
						enumerable: true
					});
					var _thrown = _record.getThrown();
					if (_thrown) {
						record.thrown = {
							"class": {
								name: String(_thrown.getClass().getName())
							}
						}
					}
					o(record);
				}
			}
		);
//		Packages.java.lang.System.err.println("ErrorManager = " + _handler.getErrorManager());
		_root.addHandler(_handler);
	}
}

//	TODO	sample usage below, refine and move
//var stderr = jsh.io.java.adapt( Packages.java.lang.System.getProperties().get("inonit.script.jsh.Main.stderr") );
//jsh.java.log.initialize(function(record) {
//	if (/^inonit\.system/.test(record.logger.name)) {
//		return;
//	}
//	jsh.shell.echo(JSON.stringify(record), { stream: stderr });
//});
//jsh.java.log.named("verify").INFO("Hey, %1$s!", "David");
