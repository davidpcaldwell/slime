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