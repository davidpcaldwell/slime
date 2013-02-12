/*
LICENSE
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

The Original Code is the jsh JavaScript/Java shell.

The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.

Contributor(s):
END LICENSE
*/
/*
	Test cases:
	Cygwin launch by absolute Cygwin path
	Cygwin launch by softlink being in PATH
	Cygwin launch by #!
	FreeBSD launch by absolute path
	FreeBSD launch by #!
	FreeBSD launch by softlink being in PATH: fail gracefully

	Future:
	FreeBSD launch by softlink being in PATH: succeed
	Cygwin launch with Java not in PATH
*/
/*
	TODO	Locating Java

	There are obviously benefits to doing this the same way on both platforms: either essentially linking at launcher build time,
	or linking at runtime.

	On UNIX currently, we are using -rpath in the linker to essentially hard-code the path to Java; this is clearly better than
	LD_LIBRARY_PATH needing to be specified, as this would be inconvenient for the user.

	On Windows, this means that jvm.dll must be in the PATH. For a possible workaround for this limitation, see:
		http://java.sun.com/products/jdk/faq/jni-j2sdk-faq.html question 3.

	If we went with dynamic linking to Java, we would need a way to locate the JDK on UNIX. If we went with static linking, we would
	need a way to "hard-code" the path on Windows (write it to a file at build time, and read it at runtime?).

	We could use a JSH_JAVA_HOME, perhaps falling back to JAVA_HOME, on both platforms. But on Windows, implementation-wise, that
	might have difficulty under Cygwin, where the JSH_JAVA_HOME variable is in Cygwin form. And there might be
	problems making the launcher a Cygwin executable (Cygwin might need to be in the PATH, and it might mess up the JNI, though it
	might not; that might be just calls running in the other direction).

	Some kind of dynamic strategy seems smart: upgrading Java should not break things, allow jsh to be used with multiple versions
	of Java. So we probably should be using dlopen on UNIX. If we used dynamic loading, then on Windows, we could even dynamically
	load Cygwin at runtime to give us access to cygpath for resolving the JSH_JAVA_HOME or JAVA_HOME environment variables.
*/
/*
	TODO	Locating jsh

	On UNIX, there is no foolproof, platform-independent way to retrieve the executable path. argv[0], on FreeBSD, just contains the
	command name if the command was in the path.

	See http://stackoverflow.com/questions/933850/how-to-find-the-location-of-the-executable-in-c.

	Implementing the following algorithm seems to make sense:
	1. If starts with /, assume absolute
	2. If contains /, use relative to PWD (or getcwd)
	3. Parse and check PATH

	On Windows, there is apparently a system call GetModuleFileName that can be used for the purpose of resolving argv[0].
*/
/*
	TODO	add Windows-without-Cygwin test cases
	TODO	add other UNIX test cases
	TODO	is there more standard way of doing pathname separator?
	TODO	FreeBSD launch by softlink being in PATH
	TODO	FreeBSD does not respect executable bit of script when sent as argument from launcher; should it?
*/

#include <stdio.h>
#include <string.h>

#include <jni.h>

#ifdef WIN32
const char SLASH = '\\';
#include "shlwapi.h"
const int PATH_MAX = MAX_PATH;

char* dirname(char *path) {
	PathRemoveFileSpec(path);
	return path;
}

char* realpath(char *path, char *other) {
	strcpy(other,path);
	return other;
}

int toAbsolute(char *path, char *absolute) {
	/*	On Windows, at least using gcc/mingw, we don't need an absolute path to find jsh; we seem to receive absolute path.	*/
	strcpy(absolute,path);
	return 1;
}
#endif

#if defined __unix__ || defined __APPLE__
#include <stdlib.h>
#include <limits.h>
#include <libgen.h>
const char SLASH = '/';

int toAbsolute(char *path, char *absolute) {
	/*	Placeholder for better algorithm which resolves relative paths, searches PATH, etc. For now, just error if it is not
		absolute.	*/
	if (path[0] != '/') {
		return 0;
	}
	strcpy(absolute,path);
	return 1;
}
#endif

JNIEnv* create_vm(char *classpath) {
	JavaVM* jvm;
	JNIEnv* env;
	JavaVMInitArgs args;
	JavaVMOption options[1];

	args.version = JNI_VERSION_1_2;
	args.nOptions = 1;
	char classpathOption[PATH_MAX];
	sprintf(classpathOption, "-Djava.class.path=%s", classpath);
	options[0].optionString = classpathOption;
	args.options = options;
	args.ignoreUnrecognized = JNI_FALSE;

	JNI_CreateJavaVM(&jvm, (void **)&env, &args);
	return env;
}

void invoke_class(JNIEnv* env, int argc, char **argv) {
	jclass helloWorldClass;
	jmethodID mainMethod;
	jobjectArray applicationArgs;
	jstring applicationArg;
	int i;

	helloWorldClass = (*env)->FindClass(env, "inonit/script/jsh/launcher/Main");

	mainMethod = (*env)->GetStaticMethodID(env, helloWorldClass, "main", "([Ljava/lang/String;)V");

	applicationArgs = (*env)->NewObjectArray(env, argc-1, (*env)->FindClass(env, "java/lang/String"), NULL);

	for (i=1; i<argc; i++) {
		applicationArg = (*env)->NewStringUTF(env, argv[i]);
		(*env)->SetObjectArrayElement(env, applicationArgs, i-1, applicationArg);
	}

	(*env)->CallStaticVoidMethod(env, helloWorldClass, mainMethod, applicationArgs);
}

void debug(char* mask, char* string) {
	//	TODO	remove JSH_LAUNCHER_CONSOLE_DEBUG?
	if (getenv("JSH_LAUNCHER_DEBUG") != NULL || getenv("JSH_LAUNCHER_CONSOLE_DEBUG") != NULL) {
		printf(mask, string);
	}
}

int main(int argc, char **argv) {
	debug("JSH_JAVA_HOME = %s\n", getenv("JSH_JAVA_HOME"));

	/*	Get the parent directory of this launcher. */
	debug("argv[0] = %s\n", argv[0]);
	char *absolutejshpath = malloc(PATH_MAX);
	if (!toAbsolute(argv[0],absolutejshpath)) {
		fprintf(stderr, "The native jsh launcher must currently be invoked via its absolute path.\n");
		fprintf(stderr, "'%s' does not appear to be an absolute path.\n", argv[0]);
		exit(1);
	}
	debug("absolutejshpath = %s\n", absolutejshpath);
	char *realjshpath = malloc(PATH_MAX);
	realpath(absolutejshpath,realjshpath);
	debug("realjshpath = %s\n", realjshpath);
	char *jsh_home = malloc(PATH_MAX);
	jsh_home = dirname(realjshpath);
	debug("jsh_home = %s\n", jsh_home);

	/*	Append jsh.jar to the path of the parent directory of this launcher. */
	char* jar = malloc(PATH_MAX);
	char path[9];
	sprintf(path, "/jsh.jar");
	path[0] = SLASH;
	sprintf(jar, "%s%s", jsh_home, path);

	debug("jar = %s\n", jar);
	JNIEnv* env = create_vm(jar);
	invoke_class(env, argc, argv);
}
