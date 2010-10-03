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

import java.lang.reflect.*;

import inonit.script.runtime.io.*;
import inonit.system.*;

public class CygwinFilesystem extends Filesystem {
	private PathHelper paths;
	
	public static CygwinFilesystem create(String root, String helper) {
		CygwinFilesystem rv = new CygwinFilesystem();
		rv.paths = new Helper(root, helper);
		return rv;
	}
	
	public CygwinFilesystem(String root) {
		this.paths = new Cygpath(root);
	}
	
	private CygwinFilesystem() {
	}

	private static abstract class PathHelper {
		abstract String toUnixPath(String path) throws IOException;
		abstract String toWindowsPath(String path) throws IOException;
	}
	
	private String getCommandOutputImpl(String path, String[] arguments) throws IOException {
		return OperatingSystem.get().getCommandOutput(path, arguments);
	}

	private boolean shellCommandImpl(String path, String[] arguments) throws IOException {
		return OperatingSystem.get().shellCommand(path, arguments);
	}
	
	private class Cygpath extends PathHelper {
		private String root;
		
		Cygpath(String root) {
			this.root = root;
		}
		
		private String getCygpathOutput(String[] arguments) throws IOException {
			String s = getCommandOutputImpl(new File(new File(this.root), "bin/cygpath").getCanonicalPath(), arguments);
			//	Strip newline output by cygpath
			s = s.substring(0, s.length() - 1);
			return s;
		}
		
		String toUnixPath(String path) throws IOException {
			return getCygpathOutput(new String[] { "-u", path });
		}
		
		String toWindowsPath(String path) throws IOException {
			return getCygpathOutput(new String[] { "-w", path });
		}
	}
	
	private static class Helper extends PathHelper {
		private InputStream output;
		private PrintWriter input;
		
		private Map getenv() {
			try {
				Method systemGetenv = System.class.getMethod("getenv", new Class[0]);
				return (Map)systemGetenv.invoke(null, new Object[0]);
			} catch (NoSuchMethodException e) {
				return null;
			} catch (SecurityException e) {
				return null;
			} catch (IllegalAccessException e) {
				throw new RuntimeException(e);
			} catch (InvocationTargetException e) {
				throw new RuntimeException(e.getTargetException());
			}
		}
		
		Helper(final String root, final String path) {
			if (path == null) throw new IllegalArgumentException("'path' must not be null.");
			final Streams.Bytes.Buffer stdin = new Streams.Bytes.Buffer();
			final Streams.Bytes.Buffer stdout = new Streams.Bytes.Buffer();
			Runnable subprocess = OperatingSystem.get().run(
				new Command.Context() {
					public File getWorkingDirectory() {
						return new File(System.getProperty("user.dir"));
					}

					public Map getSubprocessEnvironment() {
						Map toUse = new HashMap();
						
						Map existing = getenv();
						if (existing != null) {
							Iterator keys = existing.keySet().iterator();
							while(keys.hasNext()) {
								Object key = keys.next();
								Object value = existing.get(key);
								toUse.put(key, value);
							}
						}

						//	TODO	Probably should prepend path here rather than overwriting
						toUse.put("PATH", root + "/bin");
						return toUse;
					}

					public OutputStream getStandardOutput() {
						return stdout.getOutputStream();
					}

					public InputStream getStandardInput() {
						return stdin.getInputStream();
					}

					public OutputStream getStandardError() {
						return System.err;
					}
				},
				new Command.Configuration() {
					public String getCommand() {
						return path;
					}

					public String[] getArguments() {
						return new String[0];
					}
				},
				new Command.Listener() {
					public void finished() {
						throw new RuntimeException("Cygwin helper exited.");
					}

					public void threw(IOException e) {
						e.printStackTrace();
						throw new RuntimeException("Cygwin helper threw " + e);
					}
				}
			);
			new Thread(subprocess).start();
			
			this.output = stdout.getInputStream();
			this.input = new PrintWriter(stdin.getOutputStream(), true);
		}
		
		synchronized String toUnixPath(String path) throws IOException {
			input.print("u" + path + "\n");
			input.flush();
			String rv = "";
			char c;
			while((c = (char)output.read()) != '\n') {
				rv += c;
			}
			return rv;
		}
		
		synchronized String toWindowsPath(String path) throws IOException {
			input.print("w" + path + "\n");
			input.flush();
			String rv = "";
			char c;
			while((c = (char)output.read()) != '\n') {
				rv += c;
			}
			return rv;
		}
	}

	//
	//	Methods used by NodeImpl
	//
	
	String getCommandOutput(String path, String[] arguments) throws IOException {
		return getCommandOutputImpl(paths.toWindowsPath(path), arguments);
	}
	
	boolean shellCommand(String path, String[] arguments) throws IOException {
		return shellCommandImpl(paths.toWindowsPath(path), arguments);
	}

	File toHostFileImpl(String path) throws IOException {
		return new java.io.File(paths.toWindowsPath(path));
	}

	String toScriptPath(String file) throws IOException {
		return paths.toUnixPath(file);
	}
	
	//
	//	Methods implementing Filesystem
	//

	protected String getPathnameSeparatorImpl() {
		return "/";
	}

	protected String getSearchpathSeparatorImpl() {
		return ":";
	}
	
	protected String getLineSeparatorImpl() {
		return "\n";
	}

	protected Node createNode(String path) {
		return NodeImpl.create(this, path);
	}

	protected Node createNode(File file) {
		return NodeImpl.create(this, file);
	}
}
