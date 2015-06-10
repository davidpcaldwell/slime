//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var _cygwinProvider;
if ($context.cygwin.root && !$context.cygwin.paths) {
	_cygwinProvider = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root)
} else {
	_cygwinProvider = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root,$context.cygwin.paths)
}
var cygwinProvider = new $context.java.FilesystemProvider(_cygwinProvider);
$exports.filesystem = new $context.Filesystem(cygwinProvider, {
	interpretNativePathname: function(pathname) {
		return this.toUnix(pathname);
	}
});

$exports.filesystem.toUnix = function(item) {
	if (isPathname(item)) {
		return new $context.Pathname({ filesystem: cygwinProvider, peer: _cygwinProvider.getNode( item.java.adapt() ) });
	}
	if (item instanceof $context.Searchpath) {
		return new $context.Searchpath({ filesystem: cygwinProvider, array: item.pathnames });
	}
	return item;
}

$exports.filesystem.toWindows = function(item) {
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
