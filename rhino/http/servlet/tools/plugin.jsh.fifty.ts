//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	export interface Exports {
		tools: {
			build: {
				(p: {
					destination: {
						directory?: slime.jrunscript.file.Directory

						//	TODO	using 'any' right now because don't feel like analyzing deprecated rhino/file/zip.js
						war?: any
					}
					rhino: boolean
					libraries?: {
						[x: string]: {
							copy(pathname: slime.jrunscript.file.Pathname, mode: { recursive: boolean })
						}
					}
					java?: {
						version?: string
					}
					compile?: slime.jrunscript.file.File[]
					parameters: {
						[x: string]: string
					}
					servlet: string
					Resources: (this: slime.jsh.httpd.Resources) => void
				}): void

				getJavaSourceFiles: (p: slime.jrunscript.file.Pathname) => slime.jrunscript.file.File[]
			}

			proxy: slime.servlet.proxy.Exports
		}
	}
}