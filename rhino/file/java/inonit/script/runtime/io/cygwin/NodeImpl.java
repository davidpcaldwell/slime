//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.io.cygwin;

import java.io.*;
import java.util.*;

import inonit.script.runtime.io.*;

class NodeImpl extends Filesystem.Node {
	private static void check(CygwinFilesystem parent) {
		if (parent == null) {
			throw new RuntimeException("'parent' is null");
		}
	}

	private static void check(String scriptPath) {
		if (scriptPath.startsWith("C:")) {
			throw new RuntimeException("Script path appears to be native; scriptPath = " + scriptPath);
		}
	}

	static NodeImpl create(CygwinFilesystem parent, String path) {
		check(parent);
		check(path);
		NodeImpl rv = new NodeImpl();
		rv.parent = parent;
		rv.scriptPath = path;
		return rv;
	}

	static NodeImpl create(CygwinFilesystem parent, File file) {
		check(parent);
		NodeImpl rv = new NodeImpl();
		rv.parent = parent;
		rv.host = file;
		return rv;
	}

	static NodeImpl createDirectory(CygwinFilesystem parent, File directoryHost, String directoryScriptPath, 
		String leafName) 
	{
		check(parent);
		check(directoryScriptPath);
		NodeImpl rv = new NodeImpl();
		rv.parent = parent;
		rv.directory = new Boolean(true);
		rv.host = new File(directoryHost, leafName);
		rv.scriptPath = directoryScriptPath + (directoryScriptPath.endsWith("/") ? "" : "/") + leafName;
		rv.softlink = new Boolean(false);
		rv.exists = new Boolean(true);
		return rv;
	}

	//	ordinary file
	static NodeImpl createFile(CygwinFilesystem parent, File directoryHost, String directoryScriptPath, String filename) {
		check(parent);
		check(directoryScriptPath);
		NodeImpl rv = new NodeImpl();
		rv.parent = parent;
		rv.directory = new Boolean(false);
		rv.host = new File(directoryHost, filename);
		rv.scriptPath = directoryScriptPath + (directoryScriptPath.endsWith("/") ? "" : "/") + filename;
		rv.softlink = new Boolean(false);
		rv.exists = new Boolean(true);
		return rv;
	}

	static NodeImpl createLink(CygwinFilesystem parent, String directoryScriptPath, String leafName) {
		check(parent);
		check(directoryScriptPath);
		NodeImpl rv = new NodeImpl();
		rv.parent = parent;
		rv.directory = null;
		rv.host = null;
		rv.scriptPath = directoryScriptPath + "/" + leafName;
		rv.softlink = new Boolean(true);
		//	Softlink may point to non-existent file
		rv.exists = null;
		return rv;
	}

	private CygwinFilesystem parent;

	private String scriptPath;
	private File host;

	private Boolean directory;
	private Boolean softlink;
	private Boolean exists;

	private File toHostFileImpl(String scriptPath) throws IOException {
		return parent.toHostFileImpl(scriptPath);
	}

	public File getHostFile() throws IOException {
		if (host == null) {
			host = toHostFileImpl(scriptPath);
		}
		return host;
	}

	private void uncache() {
		directory = null;
		softlink = null;
		exists = null;
		if (scriptPath != null) {
			host = null;
		}
	}

	public boolean exists() throws IOException {
		if (exists == null) {
			try {
				exists = new Boolean(getHostFile().exists());
			} catch (IOException e) {
				String[] tokens = scriptPath.substring(1).split("/");
				if (tokens[0].equals("cygdrive") && tokens[1].endsWith(".exe")) {
					exists = new Boolean(false);
				} else {
					throw e;
				}
			}
		}
		return exists.booleanValue();
	}

	public String getScriptPath() throws IOException {
		if (scriptPath == null) {
			scriptPath = parent.toScriptPath(host.getCanonicalPath());
		}
		return scriptPath;
	}

	public boolean isDirectory() throws IOException {
		if (directory == null) {
			directory = new Boolean( getHostFile().isDirectory() );
		}
		return directory.booleanValue();
	}

	boolean isSoftlink() throws IOException {
		if (softlink == null) {
			softlink = new Boolean( parent.isSoftlink(this) );
		}
		return softlink.booleanValue();
	}

	public boolean delete() throws IOException {
		if (!exists()) {
			return false;
		} else {
			uncache();
			return parent.delete(this);
		}
	}

	public boolean mkdir() throws IOException {
		uncache();
		return parent.mkdir(this);
	}

	public boolean mkdirs() throws IOException {
		uncache();
		return parent.mkdirs(this);
	}

	public Filesystem.Node[] list(FilenameFilter pattern) throws IOException {
		return parent.list(this, pattern);
	}

	public final OutputStream writeBinary(boolean append) throws IOException {
		uncache();
		return new java.io.FileOutputStream(getHostFile(), append);
	}

	public final Writer writeText(boolean append) throws IOException {
		uncache();
		return new java.io.FileWriter(getHostFile(), append);
	}
}
