//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;
import javax.lang.model.element.*;
import javax.tools.*;

public abstract class Code {
	public static abstract class Classes {
		public abstract URL getResource(String path);
	}

//	private static Source createSource(File[] files) {
//		try {
//			java.net.URL[] urls = new java.net.URL[files.length];
//			for (int i = 0; i < urls.length; i++) {
//				urls[i] = files[i].toURI().toURL();
//			}
//			ClassLoader loader = new java.net.URLClassLoader(urls, null);
//			return Source.create(loader);
//		} catch (java.io.IOException e) {
//			throw new RuntimeException("Unreachable", e);
//		}
//	}

	public static abstract class Source {
		public static abstract class File {
			public abstract URI getURI();
			public abstract String getSourceName();
			public abstract InputStream getInputStream();
			public abstract Long getLength();
			public abstract java.util.Date getLastModified();

			public final Reader getReader() {
				InputStream in = getInputStream();
				if (in == null) return null;
				return new InputStreamReader(in);
			}

			public static File create(final java.io.File file) {
				return new File() {
					@Override public URI getURI() {
						return file.toURI();
					}

					@Override public String getSourceName() {
						try {
							return file.getCanonicalPath();
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Long getLength() {
						return new Long(file.length());
					}

					@Override public java.util.Date getLastModified() {
						return new java.util.Date(file.lastModified());
					}

					@Override public InputStream getInputStream() {
						try {
							return new FileInputStream(file);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			//	TODO	Where is this called, and does it need a length argument?
			public static File create(final String name, final Long length, final java.util.Date modified, final InputStream in) {
				return new File() {
					@Override public URI getURI() {
						throw new UnsupportedOperationException();
					}

					@Override public String getSourceName() {
						return name;
					}

					@Override public Long getLength() {
						return length;
					}

					@Override public java.util.Date getLastModified() {
						return modified;
					}

					@Override public InputStream getInputStream() {
						return in;
					}
				};
			}

			public static File create(final String name, final InputStream in) {
				return create(name, null, null, in);
			}
		}

		public static Source NULL = new ResourceBased() {
			@Override public String toString() { return "Code.Source.NULL"; }

			public File getFile(String path) {
				return null;
			}
		};

		public static Source system(final String prefix) {
			return new ResourceBased() {
				@Override public String toString() {
					return "Source: prefix=" + prefix + " loader=" + ClassLoader.getSystemClassLoader();
				}

				public File getFile(String path) {
					InputStream in = ClassLoader.getSystemClassLoader().getResourceAsStream(prefix+path);
					if (in == null) return null;
					return File.create("bootclasspath:" + prefix+path, in);
				}
			};
		}

//		public static Source create(final ClassLoader loader) {
//			return new Source() {
//				@Override public String toString() {
//					return "Source: loader=" + loader;
//				}
//
//				public InputStream getResourceAsStream(String path) {
//					return loader.getResourceAsStream(path);
//				}
//			};
//		}
//
//		public static Source create(final ClassLoader loader, final String prefix) {
//			return new Source() {
//				@Override public String toString() {
//					return "Source: prefix=" + prefix + " loader=" + loader;
//				}
//
//				public InputStream getResourceAsStream(String path) {
//					return loader.getResourceAsStream(prefix + path);
//				}
//			};
//		}
//

		public static Source create(final java.net.URL url) {
			return new UrlBased(url);
		}

		public static Source create(java.io.File file) {
			try {
				return create(file.toURI().toURL());
			} catch (java.net.MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

//		public static abstract class Resources {
//			public abstract Long getLength(String path) throws IOException;
//			public abstract java.util.Date getLastModified(String path) throws IOException;
//			public abstract InputStream getResourceAsStream(String path) throws IOException;
//		}
//
//		public static Source create(final Resources resources) {
//			return new ResourceBased() {
//				@Override public String toString() {
//					return Code.Source.class.getName() + " resources=" + resources;
//				}
//
//				public File getFile(String path) throws IOException {
//					InputStream in = resources.getResourceAsStream(path);
//					if (in == null) return null;
//					return File.create(this.toString() + ":" + path, resources.getLength(path), resources.getLastModified(path), in);
//				}
//
//				@Override public Classes getClasses() {
//					return null;
//				}
//			};
//		}

//		/**
//		 *	Returns a stream that reads the content of the resource at the given path, or <code>null</code> if no resource can
//		 *	be found at that path.
//		 */
//		public abstract InputStream getResourceAsStream(String path) throws IOException;
		public abstract File getFile(String path) throws IOException;
		public abstract Classes getClasses();

		public final Source child(final String prefix) {
			//	TODO	should figure out /; maybe should only add it if we don't already end in it
			final String prepend = (prefix != null && prefix.length() > 0) ? (prefix + "/") : "";
			return new Code.Source() {
				@Override public String toString() {
					return Code.Source.class.getName() + " source=" + Source.this + " prefix=" + prefix;
				}

				public Source.File getFile(String path) throws IOException {
					return Source.this.getFile(prepend + path);
				}

				public Code.Classes getClasses() {
					final Classes delegate = Source.this.getClasses();
					if (delegate == null) {
						return null;
					}
					return new Classes() {
						@Override public URL getResource(String path) {
							return delegate.getResource(prepend+path);
						}
					};
				}
			};
		}

		private static class UrlBased extends Source {
			private java.net.URL url;
			private Classes classes;

			UrlBased(final java.net.URL url) {
				this.url = url;
				this.classes = new Classes() {
					private java.net.URLClassLoader delegate = new java.net.URLClassLoader(new java.net.URL[] {url});

					@Override public URL getResource(String path) {
						return delegate.getResource(path);
					}
				};
			}

			@Override public String toString() {
				return Code.Source.class.getName() + " url=" + url;
			}

//			public InputStream getResourceAsStream(String path) {
//				URL url = classes.getResource(path);
//				if (url != null) {
//					try {
//						return url.openStream();
//					} catch (IOException e) {
//						//	if we cannot open it, returning null seems fine
//					}
//				}
//				return null;
//			}

			private String getSourceName(URL url, String path) {
				if (url.getProtocol().equals("file")) {
					try {
						java.io.File file = new java.io.File(url.toURI());
						return file.getCanonicalPath();
					} catch (URISyntaxException e) {
					} catch (IOException e) {
					}
				}
				return url.toExternalForm();
			}

			public File getFile(String path) throws IOException {
				URL url = classes.getResource(path);
				if (url == null) return null;
				try {
					URLConnection connection = url.openConnection();
					//	TODO	Do something fancier to retain backward compatibility with 1.6
//					Long length = (connection.getContentLengthLong() == -1) ? null : new Long(connection.getContentLengthLong());
					Long length = (connection.getContentLength() == -1) ? null : new Long(connection.getContentLength());
					java.util.Date modified = (connection.getLastModified() == 0) ? null : new java.util.Date(connection.getLastModified());
					return File.create(
						getSourceName(url,path),
						length,
						modified,
						connection.getInputStream()
					);
				} catch (IOException e) {
					//	TODO	is this the only way to test whether the URL is available?
					return null;
				}
			}

			public Classes getClasses() {
				return classes;
			}
		}

		private static abstract class ResourceBased extends Source {
			public Classes getClasses() {
				return null;
			}
		}
	}

	private static Code create(final Code.Source source) {
		return new Code() {
			@Override public String toString() {
				return getClass().getName() + " source=" + source;
			}

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return source.child("$jvm/classes");
			}
		};
	}

	public static Code system(final String prefix) {
		final Source source = Source.system(prefix);
		return create(source);
	}

	public static Code create(final Code.Source source, final String prefix) {
		Code.Source s = source.child(prefix);
		return create(s);
	}

	public static Code create(final Source js, final Source classes) {
		return new Code() {
			@Override public String toString() {
				return getClass().getName() + " js=" + js + " classes=" + classes;
			}

			public Source getScripts() {
				return js;
			}

			public Source getClasses() {
				return classes;
			}
		};
	}

	public static Code slime(final File file) {
		return new Code() {
			public String toString() {
				try {
					String rv = getClass().getName() + ": slime=" + file.getCanonicalPath();
					return rv;
				} catch (IOException e) {
					return getClass().getName() + ": " + file.getAbsolutePath() + " [error getting canonical]";
				}
			}
			private Source source = Source.create(file);

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return source.child("$jvm/classes");
			}
		};
	}

	private static javax.tools.JavaCompiler javac;

	private static class MemoryJavaClasses {
		private Map<String,OutputClass> classes = new HashMap<String,OutputClass>();

		private class OutputClass implements JavaFileObject {
			private String name;
			private ByteArrayOutputStream out;

			OutputClass(String name) {
				this.name = name;
			}

			public Kind getKind() {
				return Kind.CLASS;
			}

			public boolean isNameCompatible(String simpleName, Kind kind) {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public NestingKind getNestingKind() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Modifier getAccessLevel() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public URI toUri() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public String getName() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public InputStream openInputStream() throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public OutputStream openOutputStream() throws IOException {
				out = new ByteArrayOutputStream();
				return out;
			}

			public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Writer openWriter() throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public long getLastModified() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean delete() {
				classes.put(name, null);
				return true;
			}

		}

		JavaFileObject forOutput(String className) {
			if (classes.get(className) != null) {
				throw new UnsupportedOperationException("Duplicate!");
			} else {
				classes.put(className, new OutputClass(className));
			}
			return classes.get(className);
		}
	}

	private static class SourceFileObject implements JavaFileObject {
		private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

		private Source.File delegate;

		SourceFileObject(Source.File delegate) {
			this.delegate = delegate;
		}

		public Kind getKind() {
			return Kind.SOURCE;
		}

		public boolean isNameCompatible(String simpleName, Kind kind) {
			if (simpleName.equals("package-info")) return false;
			if (kind == JavaFileObject.Kind.SOURCE) {
				String basename = delegate.getSourceName().substring(delegate.getSourceName().lastIndexOf("/")+1);
				String className = basename.substring(0,basename.length()-".java".length());
				return className.equals(simpleName);
			}
			throw new UnsupportedOperationException("simpleName = " + simpleName + " kind=" + kind);
		}

		public NestingKind getNestingKind() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public Modifier getAccessLevel() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public URI toUri() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public String getName() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public InputStream openInputStream() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public OutputStream openOutputStream() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
			return streams.readString(delegate.getInputStream());
		}

		public Writer openWriter() throws IOException {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public long getLastModified() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		public boolean delete() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}
	}

	private static Source getCompiledClasses(final Source source) {
		return new Source() {
			private javax.tools.JavaFileManager jfm;

			private ClassLoader classpath = new ClassLoader() {
				protected Class findClass(String name) throws ClassNotFoundException{
					throw new ClassNotFoundException(name);
				}
			};

			private JavaFileObject getFileObject(final Source.File java) {
				return new SourceFileObject(java);
			}

			@Override
			public Source.File getFile(String path) throws IOException {
				String className = path.substring(0,path.length()-".class".length());
				String sourceName = className + ".java";
//				className = className.replace("/", ".");
				Source.File java = source.getFile("java/" + sourceName);
				if (java == null) {
					java = source.getFile("rhino/" + path);
				}
				if (java != null) {
					if (javac == null) {
						javac = javax.tools.ToolProvider.getSystemJavaCompiler();
					}
					if (jfm == null) {
						jfm = new javax.tools.JavaFileManager() {
							private javax.tools.JavaFileManager delegate = javac.getStandardFileManager(null, null, null);
							private MemoryJavaClasses compiled = new MemoryJavaClasses();

							public ClassLoader getClassLoader(JavaFileManager.Location location) {
								if (location == StandardLocation.CLASS_PATH) return classpath;
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public Iterable<JavaFileObject> list(JavaFileManager.Location location, String packageName, Set<JavaFileObject.Kind> kinds, boolean recurse) throws IOException {
								if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.list(location, packageName, kinds, recurse);
								System.err.println("list location=" + location + " packageName=" + packageName + " kinds=" + kinds + " recurse=" + recurse);
								return Arrays.asList(new JavaFileObject[0]);
							}

							public String inferBinaryName(JavaFileManager.Location location, JavaFileObject file) {
								if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.inferBinaryName(location, file);
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public boolean isSameFile(FileObject a, FileObject b) {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public boolean handleOption(String current, Iterator<String> remaining) {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public boolean hasLocation(JavaFileManager.Location location) {
								if (location == StandardLocation.ANNOTATION_PROCESSOR_PATH) return false;
								if (location == StandardLocation.SOURCE_PATH) return true;
								if (location == StandardLocation.NATIVE_HEADER_OUTPUT) return false;
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public JavaFileObject getJavaFileForInput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind) throws IOException {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public JavaFileObject getJavaFileForOutput(JavaFileManager.Location location, String className, JavaFileObject.Kind kind, FileObject sibling) throws IOException {
								if (location == StandardLocation.CLASS_OUTPUT) {
									return compiled.forOutput(className);
								}
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public FileObject getFileForInput(JavaFileManager.Location location, String packageName, String relativeName) throws IOException {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public FileObject getFileForOutput(JavaFileManager.Location location, String packageName, String relativeName, FileObject sibling) throws IOException {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public void flush() throws IOException {
							}

							public void close() throws IOException {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}

							public int isSupportedOption(String option) {
								throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
							}
						};
					}
					javax.tools.JavaFileObject jfo = getFileObject(java);
					javax.tools.JavaCompiler.CompilationTask task = javac.getTask(null, jfm, null, null, null, Arrays.asList(new JavaFileObject[] { jfo }));
					boolean success = task.call();
					if (!success) {
						throw new RuntimeException("Failure");
					}
				}
				return null;
			}

			private Classes classes = new Classes() {
				@Override
				public URL getResource(String path) {
					System.err.println("getResource(" + path + ")");
					return null;
				}
			};

			@Override
			public Classes getClasses() {
				System.err.println("getClasses()");
				return null;
			}
		};
	}

	public static Code unpacked(final File base) {
		if (!base.isDirectory()) {
			throw new IllegalArgumentException(base + " is not a directory.");
		}
		return new Code() {
			private Source source = Source.create(base);
			private Source classes = getCompiledClasses(source);

			public String toString() {
				try {
					String rv = getClass().getName() + ": base=" + base.getCanonicalPath();
					return rv;
				} catch (IOException e) {
					return getClass().getName() + ": " + base.getAbsolutePath() + " [error getting canonical]";
				}
			}

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				boolean COMPILE_IN_MEMORY = false;
				return (COMPILE_IN_MEMORY) ? classes : Source.NULL;
			}
		};
	}

	public static Code jar(final File jar) {
		return new Code() {
			public Source getScripts() {
				return null;
			}

			public Source getClasses() {
				return Source.create(jar);
			}
		};
	}

	public abstract Source getScripts();
	public abstract Source getClasses();
}