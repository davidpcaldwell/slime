$set(function(module) {
	var Repository = function Repository() {
		var rv = this;
		rv.unit = new function() {
			this.createFile = function(p) {
				rv.directory.getRelativePath(p.path).write(p.content, { append: false });
				if (p.add) {
					rv.add({ files: [rv.directory.getRelativePath(p.path).toString()] });
				}
				return rv.directory.getFile(p.path);
			};

			this.editFile = function(p) {
				var edited = rv.directory.getFile(p.path).read(String);
				if (typeof(p.content) == "string") {
					edited = p.content;
				} else if (typeof(p.edit) == "function") {
					edited = p.edit(edited);
				}
				rv.directory.getRelativePath(p.path).write(edited, { append: false });
			};

			this.readFile = function(p) {
				if (typeof(p) == "string") {
					p = { path: p };
				}
				return rv.directory.getFile(p.path).read(String);
			};

			this.clone = function(p) {
				var cloned = rv.clone(p);
				Repository.call(cloned);
				return cloned;
			}
		}
	};
	
	module.Repository = (function(was) {
		return function() {
			was.apply(this,arguments);
			Repository.apply(this,arguments);
		}
	})(module.Repository);
	
	module.init = (function(was) {
		return function() {
			var rv = was.apply(this,arguments);
			Repository.call(rv);
			return rv;
		}
	})(module.init);
});
