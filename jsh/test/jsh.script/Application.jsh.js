jsh.script.Application.run(new function() {
	this.options = {
		gstring: String,
		gboolean: false
	};
	
	this.commands = new function() {
		this.doIt = new function() {
			this.getopts = new function() {
				this.options = {
					lstring: "foo",
					lboolean: false
				};
			}
			
			this.run = function(p) {
				jsh.shell.echo(JSON.stringify(p));
			}
		}
	}
});
