var parseChromeProcess = function(program,process) {
	var command = process.command;
	if (command.substring(0,program.toString().length) == program.toString()) {
		var argumentString = command.substring(program.toString().length+1);
		process.chrome = {
			arguments: argumentString,
			userDataDir: $context.user.toString(),
			ignored: []
		};
		var tokens = argumentString.split(" ");
		//process.chrome.tokens = tokens;
		
		var getArgument = function(token) {
			if (token.substring(0,2) == "--") {
				var nv = token.substring(2).split("=");
				if (nv.length == 2) {
					return {
						name: nv[0],
						value: nv[1]
					}
				}
			}
		};

		for (var i=0; i<tokens.length; i++) {
			var token = tokens[i];
			var argument = getArgument(token);
			if (argument && argument.name == "user-data-dir") {
				process.chrome.userDataDir = argument.value;
			} else if (argument && argument.name == "proxy-pac-url") {
				process.chrome.proxyPacUrl = argument.value;
			} else {
				process.chrome.ignored.push(token);
			}
		}
	}
}

$exports.getChromeProcesses = function() {
	var ps = $context.os.process.list();
	ps.forEach(function(process) {
		parseChromeProcess($context.program,process);
	});
	var chromes = ps.filter(function(process) {
		return process.chrome;
	});
	return chromes;
};

$exports.isRunning = function(userDataDir) {
	//	The below file appears to have been removed in Chrome 75, at least running in a VM. Unclear. So
	//	trying the below detection scheme
	var byFile = userDataDir.list().filter(function(node) {
		return node.pathname.basename == "RunningChromeVersion";
	}).length > 0;
	if (byFile) return true;
	var processes = $exports.getChromeProcesses();
	for (var i=0; i<processes.length; i++) {
		if (processes[i].chrome.userDataDir == userDataDir.toString()) return true;
	}
	return false;
};

$exports.isDefaultRunning = function() {
	return $exports.isRunning($context.user);
}
