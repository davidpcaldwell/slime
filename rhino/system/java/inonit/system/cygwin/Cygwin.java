//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME operating system interface.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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