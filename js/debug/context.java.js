$exports.cpu = function(spi) {
	return new function() {
		this.profiles = new function() {
			var currentThread = function() {
				return Packages.java.lang.Thread.currentThread();
			}

			var getThreadId = function() {
				return Packages.java.lang.System.identityHashCode(currentThread());
			}

			var byThread = {};

			this.current = function() {
				if (!byThread[getThreadId()]) {
					byThread[getThreadId()] = { id: String(currentThread().getName()), profile: new spi.Profile() };
				}
				return byThread[getThreadId()].profile;
			}

			this.all = function() {
				var rv = [];
				for (var x in byThread) {
					rv.push(byThread[x]);
				}
				return rv;
			}
		}
	}
};
