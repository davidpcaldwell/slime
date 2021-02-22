namespace slime.jrunscript.tools.github {
	export interface Context {
		library: { http: slime.jrunscript.http.client.Exports, shell: jsh["shell"] }
	}

	export interface Repository {
		id: number
		node_id: string
		name: string
		full_name: string
	}

	export interface Session {
		repositories: { list: () => slime.jrunscript.tools.github.Repository[] }
	}

	export interface Exports {
		Session: (o: any) => slime.jrunscript.tools.github.Session
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.suite = function() {
			const verify = fifty.verify;
			const api = fifty.global.jsh.tools.github;
			verify(api,"api!").evaluate.property("Session").is.type("function");
			verify(api,"api!!").evaluate.property("Foo").is.type("undefined");
		}
	}
//@ts-ignore
)(fifty);
