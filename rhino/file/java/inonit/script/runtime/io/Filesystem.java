//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.io;

import java.io.*;

public abstract class Filesystem {
	public static Filesystem create() {
		return new NativeFilesystem();
	}

	protected abstract Node createNode(String path) throws IOException;
	protected abstract Node createNode(File file) throws IOException;

	protected abstract String getPathnameSeparatorImpl();
	protected abstract String getSearchpathSeparatorImpl();
	protected abstract String getLineSeparatorImpl();

	/**
	 *	Returns a node corresponding to the given path in this filesystem.
	 *
	 *	@param path A string representing a path in this filesystem; will be an absolute path (see os.js newPeer(), which uses
	 *		the getNode(java.io.File) method if the path is relative)
	 *	@return A Node corresponding to that path.
	 *	@throws IOException
	 */
	public final Node getNode(String path) throws IOException {
		return createNode(path);
	}

	public final Node getNode(File file) throws IOException {
		return createNode(file);
	}

	public final String toHostSearchpath(String[] scriptPaths) throws IOException {
		String rv = "";
		for (int i=0; i<scriptPaths.length; i++) {
			Node node = getNode(scriptPaths[i]);
			rv += node.getHostFile().getCanonicalPath();
			if (i+1 != scriptPaths.length) {
				rv += java.io.File.pathSeparator;
			}
		}
		return rv;
	}

	public final String getPathnameSeparator() {
		return getPathnameSeparatorImpl();
	}

	public final String getSearchpathSeparator() {
		return getSearchpathSeparatorImpl();
	}

	public final String getLineSeparator() {
		return getLineSeparatorImpl();
	}

	public static abstract class Node {
		public abstract String getScriptPath() throws IOException;
		public abstract File getHostFile() throws IOException;

		public abstract boolean exists() throws IOException;
		public abstract boolean isDirectory() throws IOException;

		public abstract Node[] list(FilenameFilter pattern) throws IOException;
		public abstract void delete() throws IOException;
		public abstract void move(Node to) throws IOException;
		public abstract void mkdir() throws IOException;
		public abstract void mkdirs() throws IOException;

		public abstract OutputStream writeBinary(boolean append) throws IOException;
		public abstract Writer writeText(boolean append) throws IOException;

		public final InputStream readBinary() throws IOException {
			return new FileInputStream( getHostFile() );
		}

		public final Reader readText() throws IOException {
			return new FileReader( getHostFile() );
		}

		//	Need this method to be public because Cygwin NodeImpl is nonpublic type, and script code refers to this method to
		//	forget Cygwin information when a pathname is the destination for a move operation. Perhaps the CygwinFilesystem itself
		//	needs a cache by pathname so that we do not have to call the method on the pathname directly (using weak references,
		//	perhaps).
		public void invalidate() {
		}
	}

	private static class NativeFilesystem extends Filesystem {
		protected Node createNode(String path) throws IOException {
			return new NodeImpl( new File(path) );
		}

		String toScriptPath(String path) throws IOException {
			return path;
		}

		File toHostFileImpl(String path) {
			return new File(path);
		}

		protected String getPathnameSeparatorImpl() {
			return File.separator;
		}

		protected String getSearchpathSeparatorImpl() {
			return File.pathSeparator;
		}

		protected String getLineSeparatorImpl() {
			return System.getProperty("line.separator");
		}

		protected Node createNode(File file) throws IOException {
			return new NodeImpl(file);
		}

		private static class NodeImpl extends Node {
			private File file;

			private File canonicalize(File file) {
				String absolute = file.getAbsolutePath();
				String[] tokens = absolute.split("\\" + File.separator);
				java.util.ArrayList rv = new java.util.ArrayList();
				for (int i=0; i<tokens.length; i++) {
					if (tokens[i].equals(".")) {
						//	do nothing
					} else if (tokens[i].equals("..")) {
						if (rv.isEmpty()) {
							rv.add("..");
						} else {
							rv.remove(rv.size()-1);
						}
					} else {
						rv.add(tokens[i]);
					}
				}
				//	TODO	analysis of how this would work with Windows drive letters
				String joined = "";
				for (int i=0; i<rv.size(); i++) {
					joined += (String)rv.get(i);
					if (i+1 != rv.size() || i == 0) {
						joined += File.separator;
					}
				}
				if (joined.length() == 0) {
					joined += File.separator;
				}
				return new File(joined);
			}

			NodeImpl(File file) throws IOException {
				this.file = canonicalize(file);
			}

			public String toString() {
				return getClass().getName() + " file= " + file;
			}

			public boolean exists() {
				return file.exists();
			}

			public boolean isDirectory() {
				return file.isDirectory();
			}

			public File getHostFile() throws IOException {
				try {
					return file.getCanonicalFile();
				} catch (IOException e) {
					throw new IOException(e.getMessage() + " path=[" + file.getPath() + "]", e);
				}
			}

			public String getScriptPath() {
				return file.getPath();
			}

			public Node[] list(FilenameFilter pattern) throws IOException {
				File[] files = this.file.listFiles(pattern);
				Node[] rv = new Node[files.length];
				for (int i=0; i<files.length; i++) {
					rv[i] = new NodeImpl(files[i]);
				}
				return rv;
			}

			private boolean delete(File file) {
				if (file.isDirectory()) {
					File[] contents = file.listFiles();
					for (int i=0; i<contents.length; i++) {
						boolean success = delete(contents[i]);
						if (!success) {
							return false;
						}
					}
					//	delete contents
				}
				return file.delete();
			}

			public void delete() throws IOException {
				boolean success = delete(this.file);
				if (!success) throw new IOException("Failed to delete: " + this.file);
			}

			public void move(Node to) throws IOException {
				NodeImpl toNode = (NodeImpl)to;
				boolean success = file.renameTo(toNode.file);
				if (!success) throw new IOException("Failed to move: " + this.file + " to " + toNode.file);
			}

			public void mkdir() throws IOException {
				boolean success = this.file.mkdir();
				if (!success) throw new IOException("Failed to create: " + this.file);
			}

			public void mkdirs() throws IOException {
				boolean success = this.file.mkdirs();
				if (!success) throw new IOException("Failed to create: " + this.file);
			}

			public final OutputStream writeBinary(boolean append) throws IOException {
				return new java.io.FileOutputStream(getHostFile(), append);
			}

			public final Writer writeText(boolean append) throws IOException {
				return new java.io.FileWriter(getHostFile(), append);
			}
		}
	}
}