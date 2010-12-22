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

import inonit.system.*;

public class Cygwin {
	private static String cygpath(String cygpath, String[] args) throws IOException {
		String rv = "";
		int i = 0;
		while (rv.length() == 0 && i < 10) {
			rv = OperatingSystem.get().getCommandOutput(
				cygpath,
				args
			);
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
			throw new IOException("cygpath failed: cygpath=" + cygpath + " arguments=" + message);
		}
		return rv;
	}

	public static Cygwin locate() {
		try {
			return new Cygwin(new File(cygpath("cygpath", new String[] { "-w", "/" })));
		} catch (IOException e) {
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

	private String cygpath(String flags, String path) throws IOException {
		return cygpath(new File(root, "bin/cygpath.exe").getCanonicalPath(), new String[] { flags, path });
	}

	private String toWindowsPath(String path) throws IOException {
		return this.cygpath("-w",path);
	}

	public String toWindowsPath(String name, boolean path) throws IOException {
		return cygpath((path) ? "-wp" : "-w", name);
	}

	public String toUnixPath(String name, boolean path) throws IOException {
		return cygpath((path) ? "-up" : "-u", name);
	}
}