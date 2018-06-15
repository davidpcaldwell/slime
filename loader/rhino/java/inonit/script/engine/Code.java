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
import java.util.logging.*;

public class Code {
	private static final inonit.system.Logging LOG = inonit.system.Logging.get();
	
	private Code() {
	}

	public static abstract class Locator {
		public abstract URL getResource(String path);
	}

	//	TODO	Rename Code.Source to Code.Loader
	public static abstract class Source {
		public static class URI {
			private static java.net.URI string(String s) {
				try {
					return new java.net.URI("slime://" + s);
				} catch (URISyntaxException e) {
					throw new RuntimeException(e);
				}
			}

			static URI create(java.net.URI delegate) {
				return new URI(delegate);
			}

			public static URI create(URL url) {
				try {
					return new URI(url.toURI());
				} catch (URISyntaxException e) {
					throw new RuntimeException(e);
				}
			}

			public static URI script(String scriptName, String path) {
				return new URI(string("script/" + scriptName.replace("/", "-") + "/" + path));
			}

			public static URI jvm(Class c, String path) {
				return new URI(string("java/" + c.getName() + "/" + path));
			}

			private java.net.URI delegate;

			private URI(java.net.URI delegate) {
				this.delegate = delegate;
			}

			java.net.URI adapt() {
				return delegate;
			}

			static URI create(java.io.File file) {
				return new URI(file.toURI());
			}
		}

		//	Rename Code.Source.File to Code.Loader.Resource
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
					@Override public String toString() {
						return file.toString();
					}
					
					@Override public URI getURI() {
						return URI.create(file);
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

			//	TODO	this implementation will not respond correctly to getInputStream() being called multiple times
			private static File create(final URL url, final URLConnection opened) {
				return new File() {
					private URLConnection connection;

					@Override public String toString() {
						return url.toString();
					}
					
					private String getSourceName(URL url) {
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

					private java.net.URI toURI(URL url) {
						//	.toURI does not work correctly for files with certain characters, like spaces.
						//	See http://stackoverflow.com/questions/4494063/how-to-avoid-java-net-urisyntaxexception-in-url-touri
						if (url.getProtocol().equals("file")) {
							return new java.io.File(url.getFile()).toURI();
						}
						try {
							return url.toURI();
						} catch (URISyntaxException e) {
							throw new RuntimeException(e);
						}
					}

					private URLConnection connect() throws IOException {
						if (connection == null) {
							if (opened != null) {
								connection = opened;
							} else {
								connection = url.openConnection();
							}
						}
						return connection;
					}

					@Override public URI getURI() {
						return new URI(toURI(url));
					}

					@Override public String getSourceName() {
						return getSourceName(url);
					}

					@Override public InputStream getInputStream() {
						try {
							return connect().getInputStream();
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Long getLength() {
					//	TODO	Do something fancier to retain backward compatibility with 1.6
//						Long length = (connection.getContentLengthLong() == -1) ? null : new Long(connection.getContentLengthLong());
//						Long length = (connection.getContentLength() == -1) ? null : new Long(connection.getContentLength());
						try {
							int i = connect().getContentLength();
							if (i == -1) return null;
							return Long.valueOf(i);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Date getLastModified() {
						try {
							long l = connect().getLastModified();
							if (l == -1) return null;
							return new Date(l);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			public static File create(final URL url) {
				return create(url, (URLConnection)null);
			}

			//	Used in rhino/io to create Code.Source.File objects in resources implementation
			public static File create(final URI uri, final String name, final Long length, final java.util.Date modified, final InputStream in) {
				return new File() {
					private byte[] bytes;

					@Override public String toString() {
						return "Code.Source.File uri=" + uri.adapt() + " name=" + name + " length=" + length + " modified=" + modified;
					}

					@Override public URI getURI() {
						return uri;
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
						if (bytes == null) {
							try {
								bytes = new inonit.script.runtime.io.Streams().readBytes(in);
							} catch (IOException e) {
								throw new RuntimeException(e);
							}
						}
						return new ByteArrayInputStream(bytes);
					}
				};
			}

			public static File create(java.net.URL url, UrlBased.HttpConnector connector) {
				try {
					URLConnection connection = url.openConnection();
					if (connector != null && connection instanceof HttpURLConnection) {
						connector.decorate((HttpURLConnection)connection);
					}
					return create(url, connection);
				} catch (IOException e) {
					//	TODO	is this the only way to test whether the URL is available?
					return null;
				}
			}
		}

		public static Source NULL = new Source() {
			@Override public String toString() { return "Code.Source.NULL"; }

			public File getFile(String path) {
				return null;
			}

			public Locator getLocator() {
				return null;
			}

			public Enumerator getEnumerator() {
				return new Enumerator() {
					@Override public String[] list(String prefix) {
						return new String[0];
					}
				};
			}
		};
		
		private static final Source system = new Source() {
			@Override public String toString() {
				return "Source: system class loader";
			}

			public File getFile(String path) {
				URL url = ClassLoader.getSystemClassLoader().getResource(path);
				if (url == null) return null;
				return File.create(url);
			}

			public Locator getLocator() {
				return null;
			}

			public Enumerator getEnumerator() {
				//	TODO	can this actually be implemented?
				return null;
			}
		};

		public static Source system(final String prefix) {
			return system.child(prefix);
		}

		static Source create(final java.net.URL url, Enumerator enumerator) {
			return new UrlBased(url, enumerator, null);
		}

		public static Source create(java.io.File file) {
			try {
				return create(file.toURI().toURL(), Enumerator.create(file));
			} catch (java.net.MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public static Source create(final java.net.URL url) {
			return new UrlBased(url, null, null);
		}
		
		public static Source bitbucketApiVersionOne(URL url) {
			return Code.Source.create(url, Code.Source.Enumerator.bitbucketApiVersionOne(url));
		}
		
		static Source create(java.net.URLClassLoader parent) {
			List<URL> urls = Arrays.asList(((URLClassLoader)parent).getURLs());
			List<Code.Source> sources = new ArrayList<Code.Source>();
			for (URL url : urls) {
				if (url.getProtocol().equals("file")) {
					try {
						java.io.File file = new java.io.File(url.toURI());
						if (file.getName().endsWith(".jar")) {
							sources.add(Code.Source.zip(file));
						} else {
							sources.add(Code.Source.create(file));
						}
					} catch (java.net.URISyntaxException e) {
						throw new RuntimeException(e);
					}
				} else {
					sources.add(Code.Source.create(url));
				}
			}
			return Code.Source.create(sources);			
		}
		
		public static Source zip(final java.io.File file) {
			try {
				return zip(file.toString(), new java.io.FileInputStream(file));
			} catch (FileNotFoundException e) {
				throw new RuntimeException(e);
			}
		}
		
		public static Source zip(final Code.Source.File file) {
			return zip(file.toString(), file.getInputStream());
		}

		private static Source zip(final String name, final java.io.InputStream stream) {
			try {
				java.util.zip.ZipInputStream in = new java.util.zip.ZipInputStream(stream);
				java.util.zip.ZipEntry entry;
				final HashMap<String,Source.File> files = new HashMap<String,Source.File>();
				while( (entry = in.getNextEntry()) != null) {
					final java.util.zip.ZipEntry ENTRY = entry;
					final byte[] bytes = new inonit.script.runtime.io.Streams().readBytes(in, false);
					final String entryName = entry.getName();
					Source.File f = new Source.File() {
						public String toString() {
							return getClass().getName() + " length=" + bytes.length;
						}

						@Override public URI getURI() {
							LOG.log(Code.Source.class, Level.FINE, "getURI()", null);
							throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
						}

						@Override public String getSourceName() {
							LOG.log(Code.Source.class, Level.FINE, "getSourceName()", null);
							return name + "!" + entryName;
//							throw new UnsupportedOperationException("Not supported yet in " + name + "."); //To change body of generated methods, choose Tools | Templates.
						}

						@Override public InputStream getInputStream() {
							return new ByteArrayInputStream(bytes);
						}

						@Override public Long getLength() {
							return new Long(bytes.length);
						}

						@Override public Date getLastModified() {
							//	TODO	there is a 1.8 implementation of this in ZipEntry but we won't use it unless we drop support
							//			for 1.7, otherwise we'll need to implement via reflection
							return null;
						}
					};
					files.put(entry.getName(), f);
				}
				final Enumerator enumerator = new Enumerator() {
					@Override public String[] list(String prefix) {
						String start = prefix + "/";
						ArrayList<String> rv = new ArrayList<String>();
						for (String key : files.keySet()) {
							if (key.startsWith(start)) {
								if (key.endsWith("/")) {
									//	ignore
								} else {
									String suffix = key.substring(start.length());
									if (suffix.indexOf("/") != -1) {
										//	subdirectory, ignore
									} else {
										rv.add(suffix);
									}
								}
							}
						}
						return rv.toArray(new String[0]);
					}
				};
				return new Code.Source() {
					@Override public String toString() { return "Code.Source zip=" + name; }

					@Override public File getFile(String path) throws IOException {
						LOG.log(Code.Source.class, Level.FINE, "getFile(" + path + ")", null);
						LOG.log(Code.Source.class, Level.FINE, String.valueOf(files.get(path)), null);
						return files.get(path);
					}

					@Override public Enumerator getEnumerator() {
						return enumerator;
					}

					@Override public Locator getLocator() {
						LOG.log(Code.Source.class, Level.FINE, "getClasses()", null);
						//	TODO	think about this
						return null;
					}
				};
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		private static Enumerator enumerator(List<Source> sources) {
			final List<Enumerator> enumerators = new ArrayList<Enumerator>();
			for (Source s : sources) {
				Enumerator e = s.getEnumerator();
				if (e == null) return null;
				enumerators.add(e);
			}
			return new Enumerator() {
				@Override public String[] list(String prefix) {
					HashSet<String> strings = new HashSet<String>();
					for (Enumerator e : enumerators) {
						String[] s = e.list(prefix);
						if (s != null) {
							for (String string : s) {
								strings.add(string);
							}
						}
					}
					return strings.toArray(new String[0]);
				}
			};
		}

		public static Source create(final List<Source> delegates) {
			final Locator classes = new Locator() {
				@Override public URL getResource(String path) {
					for (Source delegate : delegates) {
						Locator c = delegate.getLocator();
						if (c != null && c.getResource(path) != null) {
							return c.getResource(path);
						}
					}
					return null;
				}
			};

			final Enumerator enumerator = enumerator(delegates);

			return new Source() {
				@Override public String toString() {
					String rv = "Code.Source: [";
					boolean first = true;
					for (Source s : delegates) {
						if (!first) {
							rv += ",";
						} else {
							first = false;
						}
						rv += s.toString();
					}
					rv += "]";
					return rv;
				}

				@Override public File getFile(String path) throws IOException {
					for (Source delegate : delegates) {
						if (delegate.getFile(path) != null) {
							return delegate.getFile(path);
						}
					}
					return null;
				}

				@Override public Locator getLocator() {
					return classes;
				}

				@Override public Enumerator getEnumerator() {
					//	TODO	implement
					return enumerator;
				}
			};
		}

		public static abstract class Enumerator {
			static Enumerator create(final java.io.File file) {
				return new Enumerator() {
					private java.io.File getDirectory(String prefix) {
						if (prefix == null) {
							return file.exists() && file.isDirectory() ? file : null;
						}
						java.io.File rv = new java.io.File(file, prefix);
						if (rv.isDirectory()) {
							return rv;
						}
						//	Not found or not directory
						return null;
					}

					@Override public String[] list(String prefix) {
						java.io.File dir = getDirectory(prefix);
						if (dir == null) return null;
						java.io.File[] files = dir.listFiles();
						ArrayList<String> rv = new ArrayList<String>();
						for (java.io.File file : files) {
							rv.add( (file.isDirectory()) ? file.getName() + "/" : file.getName() );
						}
						return rv.toArray(new String[rv.size()]);
					}
				};
			}
			
			static Enumerator bitbucketApiVersionOne(final URL base) {
				return new Enumerator() {
					@Override public String[] list(String prefix) {
						try {
							URL url = (prefix == null) ? base : new URL(base, prefix);
							BufferedReader lines = new BufferedReader(new InputStreamReader(url.openConnection().getInputStream()));
							List<String> rv = new ArrayList<String>();
							String line;
							while( (line = lines.readLine()) != null) {
								rv.add(line);
							}
							return rv.toArray(new String[0]);
						} catch (MalformedURLException e) {
							throw new RuntimeException(e);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			public abstract String[] list(String prefix);
		}

		public static abstract class HttpConnector {
			public abstract void decorate(HttpURLConnection connection);

			public static final HttpConnector NULL = new HttpConnector() {
				@Override public void decorate(HttpURLConnection connection) {
				}
			};
		}

		public abstract File getFile(String path) throws IOException;
		public abstract Enumerator getEnumerator();
		public abstract Locator getLocator();

		private String getChildPrefix(String prefix) {
			if (prefix == null || prefix.length() == 0) return "";
			if (prefix.endsWith("/")) return prefix;
			return prefix + "/";
		}

		public final Source child(final String prefix) {
			final String prepend = getChildPrefix(prefix);
			return new Code.Source() {
				@Override public String toString() {
					return Code.Source.class.getName() + " source=" + Source.this + " prefix=" + prefix;
				}

				public Source.File getFile(String path) throws IOException {
					return Source.this.getFile(prepend + path);
				}

				public Locator getLocator() {
					final Locator delegate = Source.this.getLocator();
					if (delegate == null) {
						return null;
					}
					return new Locator() {
						@Override public URL getResource(String path) {
							return delegate.getResource(prepend+path);
						}
					};
				}

				public Enumerator getEnumerator() {
					final Enumerator parent = Source.this.getEnumerator();
					if (parent != null) {
						return new Enumerator() {
							@Override public String[] list(String subprefix) {
								String sub = (subprefix == null) ? "" : subprefix;
								return parent.list(prepend + sub);
							}
						};
					} else {
						return null;
					}
				}
			};
		}

		private static class UrlBased extends Source {
			private java.net.URL url;
			private Enumerator enumerator;
			private HttpConnector connector;
			private Locator classes;

			UrlBased(final java.net.URL url, Enumerator enumerator, HttpConnector connector) {
				//	TODO	could this.url be replaced by calls to the created classes object?
				this.url = url;
				this.enumerator = enumerator;
				this.connector = connector;
				this.classes = new Locator() {
					private java.net.URLClassLoader delegate = new java.net.URLClassLoader(new java.net.URL[] {url});

					@Override public URL getResource(String path) {
						return delegate.getResource(path);
					}
				};
			}

			@Override public String toString() {
				return Code.Source.class.getName() + " url=" + url;
			}

			public File getFile(String path) throws IOException {
				URL url = classes.getResource(path);
				if (url == null) return null;
				return File.create(url, connector);
			}

			public Enumerator getEnumerator() {
				return enumerator;
			}

			public Locator getLocator() {
				return classes;
			}
		}
	}
}