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
			context.execute(<>CREATE TABLE version (id INTEGER)</>);
			context.execute(<>INSERT INTO version (id) VALUES (0)</>);
		});
	}
	var version = schema.row(<>SELECT id FROM version</>)[0];
	while(version < p.ddl.length) {
		schema.perform(function(context) {
			p.ddl[version](context);
			context.execute(<>UPDATE version SET id = {++version}</>)
		});
	}
	return schema;
}