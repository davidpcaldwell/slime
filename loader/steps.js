$exports.run = function(p) {
	var events = (p.on) ? $context.Events(p) : $context.Events({ source: {} });
	var list = p.list.slice();
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
}

$exports.Task = function(p) {
	var list = p.list.slice();
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
						running.push(task);
						list.splice(i,1);
						if (tell) {
							trace("Executing task " + task);
							task(ItemTell(task));
							i--;
						} else {
							task();
							i = 0;
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
	var events = $context.Events({ source: rv });
	return rv;
}