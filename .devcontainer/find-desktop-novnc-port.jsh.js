//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		// # SLIME=$(readlink -f $(dirname $0)/..)
		// # >&2 echo "In find-vnc-port: ${SLIME}"

		// # cd ${SLIME}
		// # for i in $(seq 1 $MAXIMUM_TRIES); do
		// # 	CONTAINER_IDS=$(docker compose ps -q local)
		// # 	>&2 echo "IDs: ${CONTAINER_IDS}"

		// # 	JSON=$(docker inspect $(docker compose ps -q local))
		// # 	>&2 echo "JSON: ${JSON}"

		// # 	sleep $DELAY_BETWEEN_TRIES
		// # done

		jsh.shell.console("Hello, World!");

		var MAXIMUM_TRIES = 10;
		var DELAY_BETWEEN_TRIES = 2;

		var SLIME = $api.fp.now(jsh.script.world.file, jsh.file.Location.parent(), jsh.file.Location.parent());

		jsh.shell.console("SLIME=" + SLIME.pathname);

		var run = $api.fp.now(
			jsh.shell.subprocess.question,
			$api.fp.world.Sensor.mapping(),
			function(f) {
				//	TODO	make these operation more fundamental
				//	TODO	specifically standardize this form of passing a command and getting a string representing stdout
				return function(/** @type { string } */ command) {
					var tokens = command.split(" ");
					var exit = f({
						command: tokens[0],
						arguments: tokens.slice(1),
						directory: SLIME.pathname,
						stdio: {
							output: "string"
						}
					});
					if (exit.status !== 0) {
						throw new Error("Command failed: " + command + "\nSTDERR:\n" + exit.stdio.error + "\n");
					}
					return exit.stdio.output;
				}
			}
		)

		for (var i=0; i<MAXIMUM_TRIES; i++) {
			var CONTAINER_IDS = run("docker compose ps -q desktop").split("\n").filter(function(id) { return Boolean(id.length)});
			if (CONTAINER_IDS.length > 0) {
				jsh.shell.console("Container IDs:[" + CONTAINER_IDS + "]");
				var json = run("docker inspect " + CONTAINER_IDS.join(" "));
				jsh.shell.console(json);
				var arr = JSON.parse(json);
				var match = arr.find(function(item) {
					return item.Config &&
						item.Config.Labels &&
						item.Config.Labels["com.docker.compose.project.working_dir"] === SLIME.pathname;
				});
				var hostPort;
				if (match && match.NetworkSettings && match.NetworkSettings.Ports && match.NetworkSettings.Ports["8080/tcp"]) {
					var portInfo = match.NetworkSettings.Ports["8080/tcp"];
					if (Array.isArray(portInfo) && portInfo.length > 0 && portInfo[0].HostPort) {
						hostPort = portInfo[0].HostPort;
					}
				}
				if (!hostPort) {
					jsh.shell.console("Could not find matching container or port mapping.");
					return 1;
				} else {
					jsh.shell.console("Host port: " + hostPort);
					run("open http://127.0.0.1:" + hostPort + "/vnc.html");
					return 0;
				}
			}
			jsh.shell.console("IDs: " + CONTAINER_IDS);
			jsh.java.Thread.sleep(DELAY_BETWEEN_TRIES * 1000);
		}
	}
//@ts-ignore
)($api,jsh);
