//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Filesystem = function(system,o) {
	this.toString = function() {
		return "Filesystem: provider=" + system;
	}

	this.Searchpath = function(array) {
		return new $context.Searchpath({ filesystem: system, array: array });
	}
	this.Searchpath.prototype = $context.Searchpath.prototype;
	this.Searchpath.parse = function(string) {
		if (!string) {
			throw new Error("No string to parse in Searchpath.parse");
		}
		var elements = string.split(system.separators.searchpath);
		var array = elements.map(function(element) {
			return system.newPathname(element);
		});
		return new $context.Searchpath({ filesystem: system, array: array });
	}

	this.Pathname = function(string) {
		return system.newPathname(string);
	}

	this.$unit = new function() {
		//	Used by unit tests for getopts as well as unit tests for this module
		this.getSearchpathSeparator = function() {
			return system.separators.searchpath;
		}
		this.getPathnameSeparator = function() {
			return system.separators.pathname;
		}
		this.temporary = function() {
			return system.temporary.apply(system,arguments);
		}
		this.Pathname = function(peer) {
			return new $context.Pathname({ filesystem: system, peer: peer });
		}
	}

	var self = this;

	this.java = system.java;

	this.$jsh = new function() {
		//	Currently used by jsh.shell.getopts for Pathname
		this.PATHNAME_SEPARATOR = system.separators.pathname;

		//	Interprets a native OS Pathname in this filesystem. Used, at least, for calculation of jsh.shell.PATH
		//	TODO	could/should this be replaced with something that uses a java.io.File?
		if (!o || !o.interpretNativePathname) {
			this.os = function(pathname) {
				return pathname;
			}
		} else {
			this.os = function(pathname) {
				return o.interpretNativePathname.call(self,pathname);
			}
		}
	}
	
	if (system.decorate) system.decorate(this);
}

var filesystems = {};

$context.java.FilesystemProvider.os = new $context.java.FilesystemProvider(Packages.inonit.script.runtime.io.Filesystem.create());
filesystems.os = new Filesystem( $context.java.FilesystemProvider.os );

if ( $context.cygwin ) {
	var _cygwinProvider;
	if ($context.cygwin.root && !$context.cygwin.paths) {
		_cygwinProvider = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root)
	} else {
		_cygwinProvider = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root,$context.cygwin.paths)
	}
	filesystems.cygwin = new Filesystem(new $context.java.FilesystemProvider(_cygwinProvider), {
		interpretNativePathname: function(pathname) {
			return this.toUnix(pathname);
		}
	});
	
	filesystems.cygwin.toUnix = function(item) {
		//	TODO	the below is almost certainly wrong; unclear what the system variable should be put it probably should be
		//			the anonymous filesystem provider created above
		if (isPathname(item)) {
			return new $context.Pathname({ filesystem: system, peer: _cygwinProvider.getNode( item.java.adapt() ) });
		}
		if (item instanceof $context.Searchpath) {
			return new $context.Searchpath({ filesystem: system, array: item.pathnames });
		}
		return item;
	}

	filesystems.cygwin.toWindows = function(item) {
		if ($context.isPathname(item)) {
			//	Unbelievably horrendous workaround, but seems to work
			//	When creating a softlink to an exe in Windows, the softlink gets the .exe suffix added to it even if it is not on the
			//	command line.
			if (item.file == null && this.Pathname( item.toString() + ".exe" ).file != null ) {
				item = this.Pathname( item.toString() + ".exe" );
			}
			return $context.java.FilesystemProvider.os.importPathname( item );
		}
		//	Searchpath currently sets the constructor property to this module-level function; would this make this instanceof
		//	work?
		if (item instanceof $context.Searchpath) {
			//	TODO	convert underlying pathnames
			return new $context.Searchpath({ filesystem: $context.java.FilesystemProvider.os, array: item.pathnames });
		}
		return item;
	}

	if ($context.addFinalizer) {
		$context.addFinalizer(function() {
			_cygwinProvider.finalize();
		});
	}
}

$exports.filesystems = filesystems;
