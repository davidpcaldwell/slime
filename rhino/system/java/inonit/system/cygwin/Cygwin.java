//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system.cygwin;

import java.io.*;

import inonit.script.runtime.io.*;
import inonit.system.*;

public class Cygwin {
	public static class CygpathException extends Exception {
		CygpathException(String message) {
			super(message);
		}
	}

	private static class CygpathCanonicalPathException extends RuntimeException {
		CygpathCanonicalPathException(IOException e) {
			super(e);
		}
	}

	private static String getCanonicalPath(File file) {
		try {
			return file.getCanonicalPath();
		} catch (IOException e) {
			throw new CygpathCanonicalPathException(e);
		}
	}

	private static String cygpath(String cygpath, String[] args) throws CygpathException {
		int TRIES = 10;
		String rv = "";
		int i = 0;
		while (rv.length() == 0 && i < TRIES) {
			Command.Result result = OperatingSystem.get().execute(cygpath, args);
			try {
				InputStream stream = result.evaluate().getOutputStream();
				Streams streams = new Streams();
				rv = streams.readString(stream);
			} catch (IOException e) {
				//	we are going to retry unless this is the TRIESth failure
			} catch (Command.Result.Failure e) {
				//	we are going to retry unless this is the TRIESth failure
			}
			if (rv.length() > 0) {
				rv = rv.substring(0,rv.length()-1);
			} else {
				i++;
			}
		}
		if (rv.length() == 0) {
			String message = "";
			for (int j=0; j<args.length; j++) {
				message += args[j];
				if (j+1 != args.length)
					message += ",";
			}
			throw new CygpathException("cygpath failed: cygpath=" + cygpath + " arguments=" + message);
		}
		return rv;
	}

	public static Cygwin locate() {
		try {
			return new Cygwin(new File(cygpath("cygpath", new String[] { "-w", "/" })));
		} catch (CygpathException e) {
			return null;
		}
	}

	public static Cygwin create(File root) {
		return new Cygwin(root);
	}

	private File root;

	Cygwin(File root) {
		this.root = root;
	}

	private String cygpath(String flags, String path) throws CygpathException {
		return cygpath(getCanonicalPath(new File(root, "bin/cygpath.exe")), new String[] { flags, path });
	}

	public String toWindowsPath(String name, boolean path) throws CygpathException {
		return cygpath((path) ? "-wp" : "-w", name);
	}

	public String toUnixPath(String name, boolean path) throws CygpathException {
		return cygpath((path) ? "-up" : "-u", name);
	}
}