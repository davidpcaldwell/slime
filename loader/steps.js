$exports.run = function(p) {
	var events = (p.on) ? $context.Events(p.on) : $context.Events({ source: {} });
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
	return function task(tell) {
		var events = $context.Events({ source: task });
		var more = true;
		var running = (tell) ? [] : null;
		
		var finish = function() {
			list.forEach(function(item) {
				events.fire("unready", item);
			});
		};
		
		while(list.length && more) {
			more = false;
			
			var startReady = function() {
				var i = 0;
				while(i < list.length) {
					if (list[i].ready()) {
						var task = list[i].task;
						running.push(task);
						list.splice(i,1);
						if (tell) {
							task(ItemTell(task));
							i--;
						} else {
							task();
							i = 0;
						}
					}
					i++;
				}
			}
			
			var ItemTell = function(item) {
				if (tell) return function(result) {
					running.splice(running.indexOf(item),1);
					//	TODO	someday store result somewhere
					startReady();
					if (running.length == 0) {
						finish();
						tell({ returned: void(0) });
					}
				}
			};
			
			startReady();
			if (!tell) {
				finish();
			}
		}		
	};
}