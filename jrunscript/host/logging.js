//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.java.internal.logging.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.java.internal.logging.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$export) {
		var _Level = Packages.java.util.logging.Level;

		/**
		 *
		 * @param { string } name
		 * @param { slime.jrunscript.native.java.util.logging.Level } _level
		 * @param { string } _message
		 * @param { any[] } varargs
		 */
		var jlog = function(name, _level, _message) {
			//	TODO	we do not provide a way to log a Throwable in the same way as inonit.system.Logging
			Packages.java.util.logging.Logger.getLogger(name).log(_level, _message, $context.api.java.Array.create({
				array: Array.prototype.slice.call(arguments,3)
			}));
		};

		var levels = ["SEVERE","WARNING","INFO","CONFIG","FINE","FINER","FINEST"];

		/**
		 *
		 * @param { Pick<slime.jrunscript.java.logging.old.Logger,"log"> } object
		 */
		var addLevelsTo = function(object) {
			var rv = $api.Object.compose(object);
			levels.forEach(function(item) {
				rv[item] = function() {
					//	TODO	hastily-added for TypeDoc upgrade from 4.0.5 to 4.5.4
					//@ts-ignore
					this.log.apply(this, [_Level[item]].concat(Array.prototype.slice.call(arguments)));
				};
			});
			return /** @type { slime.jrunscript.java.logging.old.Logger } */ (rv);
		}

		/**
		 *
		 * @param { string } name
		 */
		var jlogger = function(name) {
			return addLevelsTo({
				log: function(_level) {
					jlog.apply(null, [name,_level].concat(Array.prototype.slice.call(arguments,1)));
				}
			});
		};

		var log = function() {
			jlog.apply(null, [$context.prefix, _Level.INFO].concat(Array.prototype.slice.call(arguments)));
		};
		log.named = function(name) {
			return jlogger($context.prefix + "." + name);
		};

		log.initialize = function(o) {
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
									name: String(_record.getLevel().getName()),
									number: Number(_record.getLevel().intValue())
								},
								logger: {
									name: String(_record.getLoggerName())
								},
								// message: String(_record.getMessage()),
								timestamp: Number(_record.getMillis()),
								//	TODO	re-insert, probably with formatting
								// parameters: parameters,
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
				// Packages.java.lang.System.err.println("ErrorManager = " + _handler.getErrorManager());
				_root.addHandler(_handler);
			}
		}

		//	TODO	sample usage below, refine and move
		//var stderr = jsh.io.java.adapt( Packages.java.lang.System.getProperties().get("inonit.script.jsh.Main.stderr") );
		//jsh.java.log.initialize(function(record) {
		//	if (/^inonit\.system/.test(record.logger.name)) {
		//		return;
		//	}
		//	jsh.shell.println(JSON.stringify(record), { stream: stderr });
		//});
		//jsh.java.log.named("verify").INFO("Hey, %1$s!", "David");
		$export({
			old: log,
			api: {
				log: function(p) {
					var _level = Packages.java.util.logging.Level[p.level];
					(
						Packages.java.util.logging.Logger
							.getLogger($context.prefix + "." + p.logger)
							.log(
								_level,
								p.message
							)
					);
				}
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export)
