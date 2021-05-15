//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var Database = $context.Database;
		$exports.get = function(p) {
			//	TODO	parameterize version table name
			var db = new Database(p);
			var catalog = db.getCatalog(p.catalog);
			if (!catalog) {
				catalog = db.createCatalog(p.catalog);
			}
			var schema = catalog.getSchema(p.schema);
			if (!schema) {
				schema = catalog.createSchema(p.schema);
			}
			if (!schema.getTable("version")) {
				schema.perform(function(context) {
					throw new Error("Removing E4X below.");
					// context.execute(<>CREATE TABLE version (id INTEGER)</>);
					// context.execute(<>INSERT INTO version (id) VALUES (0)</>);
				});
			}
			throw new Error("Removing E4X below.");
			// var version = schema.row(<>SELECT id FROM version</>)[0];
			while(version < p.ddl.length) {
				schema.perform(function(context) {
					p.ddl[version](context);
					throw new Error("Removing E4X below.");
					// context.execute(<>UPDATE version SET id = {++version}</>)
				});
			}
			return schema;
		}
	}
)();
