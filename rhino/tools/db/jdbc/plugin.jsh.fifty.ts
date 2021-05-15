//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.db.jdbc {
	export interface Exports {
		mysql: slime.jrunscript.db.mysql.Exports & {
			install: (p: {
				to: slime.jrunscript.file.Pathname
			}) => {
				server: (p?: { port?: number, data?: slime.jrunscript.file.Pathname }) => slime.jrunscript.db.mysql.server.Server
				client: () => slime.jrunscript.db.mysql.client.Client
			}
		}
	}
}