package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;

import javax.lang.model.element.*;
import javax.tools.*;

public class Java {
	private static javax.tools.JavaCompiler javac;

	static javax.tools.JavaCompiler compiler() {
		if (javac == null) {
			javac = javax.tools.ToolProvider.getSystemJavaCompiler();
		}
		return javac;
	}

	private static List<URL> getClassLoaderUrls() {
		if (Code.class.getClassLoader() instanceof URLClassLoader) {
			return Arrays.asList( ((URLClassLoader)Code.class.getClassLoader()).getURLs() );
		} else {
			return new ArrayList<URL>();
		}
	}

	static abstract class Classes {
		abstract JavaFileObject forOutput(String className);
		abstract Compiled getCompiledClass(String className);
		
		final JavaFileManager getJavaFileManager() {
			return createJavaFileManager(this, getClassLoaderUrls(), compiler());
		}
		
		static Classes memory() {
			return new MemoryClasses();
		}
	}
	
	static abstract class Compiled implements JavaFileObject {
		abstract byte[] getBytes();
	}
	
	private static JavaFileManager createJavaFileManager(final Java.Classes compiled, final List<URL> urls, final JavaCompiler javac) {
		final boolean USE_STANDARD_FILE_MANAGER_TO_LIST_CLASSPATH = true;

//		final List<URL> urls = getClassLoaderUrls();

		final ClassLoader classpath = new ClassLoader() {
			protected Class findClass(String name) throws ClassNotFoundException{
				throw new ClassNotFoundException(name);
			}
		};

		return new javax.tools.JavaFileManager() {
			private javax.tools.JavaFileManager delegate = javac.getStandardFileManager(null, null, null);

			public ClassLoader getClassLoader(JavaFileManager.Location location) {
				if (location == StandardLocation.CLASS_PATH) return classpath;
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Iterable<JavaFileObject> list(JavaFileManager.Location location, String packageName, Set<JavaFileObject.Kind> kinds, boolean recurse) throws IOException {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.list(location, packageName, kinds, recurse);
				if (location == StandardLocation.CLASS_PATH) return delegate.list(location, packageName, kinds, recurse);
				if (location == StandardLocation.SOURCE_PATH) return Arrays.asList(new JavaFileObject[0]);
				if (true) throw new RuntimeException("No list() implementation for " + location);
				return Arrays.asList(new JavaFileObject[0]);
			}

			public String inferBinaryName(JavaFileManager.Location location, JavaFileObject file) {
				if (location == StandardLocation.PLATFORM_CLASS_PATH) return delegate.inferBinaryName(location, file);
				if (location == StandardLocation.CLASS_PATH) return delegate.inferBinaryName(location, file);
//				if (location == StandardLocation.CLASS_PATH) {
//					System.err.println("inferbinaryname " + location + " " + file);
//					int lastPeriod = file.getName().lastIndexOf(".");
//					if (lastPeriod == -1) throw new RuntimeException("No period: " + file.getName());
//					String rv = file.getName().substring(0,lastPeriod).replace(java.io.File.separator, ".");
//					System.err.println("inferbinaryname " + location + " " + file + " " + rv);
//					System.err.println("delegate " + location + " " + file + " " + delegate.inferBinaryName(location, file));
//					return rv;
//				}
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
				//	StandardLocation.NATIVE_HEADER_OUTPUT not defined before Java 8
				if (location.getName().equals("NATIVE_HEADER_OUTPUT")) return false;
				throw new UnsupportedOperationException("Not supported yet: " + location.getName());
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

	private static class MemoryClasses extends Classes {
		private Map<String,OutputClass> classes = new HashMap<String,OutputClass>();

		private class OutputClass extends Compiled {
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

			byte[] getBytes() {
				return out.toByteArray();
			}
		}

		JavaFileObject forOutput(String className) {
			//System.err.println("forOutput: " + className);
			if (false && classes.get(className) != null) {
				throw new UnsupportedOperationException("Duplicate!");
			}
			classes.put(className, new OutputClass(className));
			return classes.get(className);
		}
		
		Compiled getCompiledClass(String className) {
			return classes.get(className);
		}

//		Code.Source.File getCompiledClass(String className) {
//			//System.err.println("getCompiledClass: " + className);
//			if (classes.get(className) != null) {
//				final Compiled oc = classes.get(className);
//				return new Code.Source.File() {
//					@Override public Code.Source.URI getURI() {
//						return Code.Source.URI.create(oc.toUri());
//					}
//
//					@Override public String getSourceName() {
//						return null;
//					}
//
//					@Override public InputStream getInputStream() {
//						return new ByteArrayInputStream(oc.getBytes());
//					}
//
//					@Override public Long getLength() {
//						//	TODO	length of array
//						return null;
//					}
//
//					@Override public Date getLastModified() {
//						//	TODO	might as well store
//						return null;
//					}
//				};
//			} else {
//				return null;
//			}
//		}
	}

//	private static abstract class ClassRepository {
//		abstract List<JavaFileObject> list(String packageName);
//
//		private static class JavaClassObject implements JavaFileObject {
//			private String name;
//			private File file;
//			private byte[] data;
//
//			JavaClassObject(String name, byte[] data) {
//				this.name = name;
//				this.data = data;
//			}
//
//			JavaClassObject(String name, File file) {
//				this.name = name;
//				this.file = file;
//			}
//
//			public Kind getKind() {
//				return Kind.CLASS;
//			}
//
//			public boolean isNameCompatible(String simpleName, Kind kind) {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public NestingKind getNestingKind() {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public Modifier getAccessLevel() {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public URI toUri() {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public String getName() {
//				return name;
//			}
//
//			public InputStream openInputStream() throws IOException {
//				if (file != null) {
//					return new FileInputStream(file);
//				}
//				if (data != null) {
//					return new ByteArrayInputStream(data);
//				}
//				throw new UnsupportedOperationException("cannot open input stream for " + name); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public OutputStream openOutputStream() throws IOException {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public Writer openWriter() throws IOException {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public long getLastModified() {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//			public boolean delete() {
//				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
//			}
//
//		}
//
//		private static class Jar extends ClassRepository {
//			private HashMap<String,ArrayList<JavaClassObject>> files = new HashMap<String,ArrayList<JavaClassObject>>();
//
//			private ArrayList<JavaClassObject> getList(String key) {
//				if (files.get(key) == null) {
//					files.put(key,new ArrayList<JavaClassObject>());
//				}
//				return files.get(key);
//			}
//
//			Jar(URL url) throws IOException {
//				java.util.jar.JarInputStream in = new java.util.jar.JarInputStream(url.openStream());
//				java.util.jar.JarEntry entry;
//				while( (entry = in.getNextJarEntry()) != null ) {
//					String path = entry.getName();
//					String packagePath = (path.lastIndexOf("/") != -1) ? path.substring(0,path.lastIndexOf("/")+1) : "";
//					ArrayList<JavaClassObject> list = getList(packagePath);
//					String name = path.substring(packagePath.length());
//					//System.err.println("packagePath=" + packagePath + " name=" + name);
//					if (name.length() > 0) {
//						ByteArrayOutputStream baos = new ByteArrayOutputStream();
//						new inonit.script.runtime.io.Streams().copy(in, baos, false);
//						byte[] data = baos.toByteArray();
//						list.add(new JavaClassObject(name,data));
//					}
//				}
//			}
//
//			List<JavaFileObject> list(String packageName) {
//				//System.err.println("list classes in JAR: " + packageName);
//				String location = packageName.replace(".","/");
//				if (location.length() > 0) {
//					location += "/";
//				}
//				List<JavaClassObject> names = getList(location);
////				ArrayList<JavaFileObject> rv = new ArrayList<JavaFileObject>();
////				for (JavaClassO name : names) {
////					rv.add(new JavaClassObject(location + name));
////				}
////				return rv;
//				ArrayList<JavaFileObject> rv = new ArrayList<JavaFileObject>();
//				for (JavaClassObject c : names) {
//					rv.add(c);
//				}
//				return rv;
//			}
//		}
//
//		private static class Directory extends ClassRepository {
//			private File directory;
//
//			Directory(URL url) throws URISyntaxException {
//				this.directory = new File(url.toURI());
//			}
//
//			@Override List<JavaFileObject> list(String packageName) {
//				//System.err.println("list classes in directory: " + packageName);
//				String path = packageName.replace(".","/");
//				File root = new File(directory,path);
//				ArrayList<JavaFileObject> rv = new ArrayList<JavaFileObject>();
//				File[] list = (root.exists()) ? root.listFiles() : new File[0];
//				for (File file : list) {
//					if (!file.isDirectory()) {
//						rv.add(new JavaClassObject(path + "/" + file.getName(),file));
//					}
//				}
//				return rv;
//			}
//		}
//
//		static ClassRepository create(URL url) throws IOException, URISyntaxException {
//			if (url.getFile().endsWith(".jar")) {
//				return new Jar(url);
//			} else if (url.getProtocol().equals("file")) {
//				return new Directory(url);
//			} else {
//				throw new RuntimeException("Unrecognized protocol: " + url.getProtocol());
//			}
//		}
//
//		private static class Composite extends ClassRepository {
//			private ArrayList<ClassRepository> delegates = new ArrayList<ClassRepository>();
//
//			Composite(List<URL> urls) throws IOException, URISyntaxException {
//				for (URL url : urls) {
//					delegates.add(create(url));
//				}
//			}
//
//			@Override List<JavaFileObject> list(String packageName) {
//				ArrayList<JavaFileObject> rv = new ArrayList<JavaFileObject>();
//				for (ClassRepository delegate : delegates) {
//					rv.addAll(delegate.list(packageName));
//				}
//				//System.err.println("list(" + packageName + "): " + rv.size());
//				return rv;
//			}
//		}
//
//		static ClassRepository create(List<URL> urls) throws IOException, URISyntaxException {
//			return new Composite(urls);
//		}
//	}
}
