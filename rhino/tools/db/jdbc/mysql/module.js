var types = new function() {
	var Types = Packages.java.sql.Types;
	
	var Character = function(precision) {
		return new function() {
			this.decode = function(rs,index) {
				return String(rs.getString(index));
			}
		}		
	};

	var CHAR = function(precision) {
		return new Character(precision);
	}

	var VARCHAR = function(precision) {
		return new Character(precision);
	};
	
	var Numeric = function() {
		this.decode = function(rs,index) {
			return Number(rs.getString(index));
		}
	};
	
	var Bit = function() {
		this.decode = function(rs,index) {
			return Boolean(rs.getBoolean(index));
		}
	};
	
	var BIGINT = new Numeric();
	var BIT = new Bit();
	var INT = new Numeric();
	var SMALLINT = new Numeric();
	var DOUBLE = new Numeric();
	
	this.getCodec = function(type) {
//		if (type.code == Types.VARCHAR) return VARCHAR(type.precision);
		if (type.code == Types.CHAR) return CHAR(type.precision);
//		if (type.code == Types.SMALLINT) return SMALLINT;
//		if (type.code == Types.BIGINT) return BIGINT;
//		if (type.code == Types.BIT) return BIT;
//		if (type.code == Types.INTEGER) return INT;
//		if (type.code == Types.DOUBLE) return DOUBLE;
		return $context.types.getCodec(type);
	};
};

var Catalog = function(p,name) {
	var _ds = new Packages.com.mysql.jdbc.jdbc2.optional.MysqlDataSource();
	if (typeof(p.host) != "undefined") _ds.setServerName(p.host);
	if (typeof(p.port) != "undefined") _ds.setPort(p.port);
	_ds.setUser(p.credentials.user);
	_ds.setPassword(p.credentials.password);
	_ds.setDatabaseName(name.toString().toLowerCase());
	var ds = new $context.DataSource({
		peer: _ds,
		types: types
	});
	
	$context.Catalog.call(this, {
	});
	
	this.getSchemas = function() {
		var only = new $context.Schema({
			name: name,
			dataSource: ds,
			Context: function() {
				return new $context.Context(new function() {
					this.connections = new function() {
						this.get = function() {
							return ds.getConnection();
						};
						
						this.release = function(connection) {
							connection.close();
						}
					}
				});
			},
			Table: function(p) {
				$context.Table.call(this, {
					schema: p.schema,
					dataSource: p.dataSource,
					name: new $context.Identifier({ string: p.name.toString().toUpperCase() })
				});
			}
		});
		return [only];
	};
	
	this.name = name;
	
	this.toString = function() {
		return "Catalog: " + name;
	}
	
	this.rows = function(sql) {
		return ds.getConnection().createQuery(sql).toArray();
	}
	
	this.forEachRow = function(sql,f) {
		ds.getConnection().createQuery(sql).forEach(f);
	}
	
	this.execute = function(sql) {
		var connection = ds.getConnection();
		var rv = connection.execute(sql);
		connection.commit();
		connection.close();
		return rv;
	};
	
	this.getReferencingKeys = function(name) {
		return ds.createMetadataQuery(function(metadata) {
			var table = (name) ? name : null;
			return metadata.getExportedKeys(null,null,table);
		});
	};
}

$exports.Database = function(p) {
	$context.Database.call(this,function(name) {
		return new Catalog(p,name);
	});
	
	var _ds = new Packages.com.mysql.jdbc.jdbc2.optional.MysqlDataSource();
	if (typeof(p.host) != "undefined") _ds.setServerName(p.host);
	if (typeof(p.port) != "undefined") _ds.setPort(p.port);
	_ds.setUser(p.credentials.user);
	_ds.setPassword(p.credentials.password);
	
	var ds = new $context.DataSource({
		peer: _ds,
		types: types
	});
	
	this.getCatalogs = function() {
		var connection = ds.getConnection();
		return connection.createMetadataQuery(function(metadata) {
			return metadata.getCatalogs();
		}).toArray().map(function(item) {
			return new Catalog(p,new $context.Identifier({ string: item.table_cat.toUpperCase() }));
		});
	};
}

