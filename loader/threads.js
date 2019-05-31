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

$exports.steps = {};

$exports.steps.run = $context.Events.Function(function(p,events) {
	var list = p.steps.slice();
	var more = true;
	while(list.length && more) {
		more = false;
		for (var i=0; i<list.length; i++) {
			if (list[i].ready()) {
				list[i].run();
				list.splice(i,1);
				more = true;
				break;
			}
		}
	}
	list.forEach(function(item) {
		events.fire("unready", item);
	});
	return {
		unready: list
	};
});

$exports.steps.Task = function(p) {
	var list = p.steps.slice();
	var rv = function task(tell) {
		var more = true;
		var running = (tell) ? [] : null;

		var finish = function() {
			list.forEach(function(item) {
				events.fire("unready", item);
			});
		};

		var trace = function(s){
		};
		while(list.length && more) {
			more = false;

			var startReady = function() {
				trace("startReady: list.length=" + list.length);
				var i = 0;
				while(i < list.length) {
					if (list[i].ready()) {
						trace("Starting: " + list[i].task);
						var task = list[i].task;
						if (running) running.push(task);
						list.splice(i,1);
						if (tell) {
							trace("Executing task " + task);
							task(ItemTell(task));
							i--;
						} else {
							task();
							i = -1;
						}
					} else {
						trace("Not starting (not ready): " + list[i].ready);
					}
					i++;
				}
			}

			var ItemTell = function(item) {
				if (tell) return function(result) {
					trace("item tell for " + item.p.call);
					running.splice(running.indexOf(item),1);
					//	TODO	someday store result somewhere
					startReady();
					if (running.length == 0) {
						trace("Finishing ...");
						finish();
						trace("Telling ...");
						tell({ returned: void(0) });
						trace("Told.");
					} else {
						trace("Running: " + running.length);
					}
				}
			};

			startReady();
			if (!tell) {
				finish();
			}
		}
	};
	var events = $context.Events({ source: rv, on: p.on });
	return rv;
}