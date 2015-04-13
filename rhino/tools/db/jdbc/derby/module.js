//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var types = $context.types;

var DataSource = function() {
	var ds = this;
	this.SchemaContext = function(schemaNameSql) {
		return new $context.Context({
			connections: {
				get: function() {
					var connection = ds.getConnection();
					//	TODO	is this standard SQL-92? If so, move it to JDBC layer
					connection.execute({ sql: "SET SCHEMA " + schemaNameSql });
					return connection;
				},
				release: function(connection) {
					connection.close();
				}
			}
		});
	}
}

var EmbeddedDataSource = function(p) {
	var _ds = new Packages.org.apache.derby.jdbc.EmbeddedDataSource();
	_ds.setDatabaseName(p.pathname.toString());
	if (p.create) {
		_ds.setCreateDatabase("create");
		_ds.getConnection().close();
	}
	var ds = new $context.DataSource({
		peer: _ds,
		types: types
	});
	DataSource.call(ds);
	return ds;
}

var Schema = function(c) {
	return new $context.Schema({
		name: c.name,
		dataSource: c.ds,
		Context: function() {
			return new c.ds.SchemaContext(c.name.sql());
		},
		Table: $context.Table
	});
}

var Catalog = function(p) {
	var ds = new EmbeddedDataSource(p);

	var MySchema = function(c) {
		return new Schema({
			name: c.name,
			ds: ds
		});
	}

	//	TODO	types argument is redundant in next line?
	$context.Catalog.call(this,{
		dataSource: ds,
		Schema: MySchema
	});

	//	TODO	check and see if this is standard SQL92; if so, move this implementation to the JDBC layer
	this.createSchema = function(p) {
		var name = new $context.Identifier(p.name);
		ds.executeDdl("CREATE SCHEMA " + name.sql());
		return new MySchema({ name: name });
	};

	var SYSTEM_SCHEMAS = ["NULLID","SQLJ","SYS","SYSCAT","SYSCS_DIAG","SYSCS_UTIL","SYSFUN","SYSIBM","SYSPROC","SYSSTAT"];

	this.getSchemas = (function(jdbc) {
		return function() {
			var rv = jdbc.apply(this,arguments);
			return rv.filter(function(schema) {
				return SYSTEM_SCHEMAS.indexOf(schema.name.toString()) == -1;
			});
		}
	})(this.getSchemas);
};

var Database = function(directory) {
	if (!directory) throw new Error("Required: database directory.");

	//	TODO	there are two implementations that seem to make sense; one that lists subdirectories (but what if one is manually
	//			created?) and one that attempts to open a connection to each subdirectory, figuring if it succeeds then that is a
	//			catalog
//	this.getCatalogs = function() {
//		throw new Error("Unimplemented.");
//	}

	this.createCatalog = function(path) {
		return new Catalog({
			pathname: directory.getRelativePath(path),
			create: true
		});
	};

	this.getCatalog = function(path) {
		if (directory) {
			if (directory.getSubdirectory(path)) {
				return new Catalog({
					pathname: directory.getRelativePath(path)
				});
			} else {
				return null;
			}
		} else {
			//	TODO	figure out Derby system home and look there, probably by referencing derby.system.home then user.dir
			throw new Error("Unimplemented");
		}
	};
};

$exports.Catalog = function(p) {
	var parameter = (function() {
		if (p.directory) return {
			pathname: p.directory.pathname
		};
		if (p.pathname) return p;
	})();
	return new Catalog(parameter);
}

$exports.Database = Database;