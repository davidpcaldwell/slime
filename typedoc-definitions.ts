//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.external {
	export namespace docker.engine.paths {
		export namespace SystemInfo {
			export namespace Responses {
				export type $200 = any
			}
		}

		export namespace VolumeDelete {
			export type PathParameters = any
			export type QueryParameters = any
		}

		export namespace VolumeCreate {
			export namespace Responses {
				export type $201 = any
			}

			export namespace Parameters {
				export type VolumeConfig = any
			}
		}

		export namespace VolumeList {
			export namespace Responses {
				export type $200 = any
			}

			export type QueryParameters = any
		}

		export namespace ContainerCreate {
			export type QueryParameters = any

			export namespace Responses {
				export type $200 = any
				export type $201 = any
			}

			export namespace Parameters {
				export type Body = any
			}
		}

		export namespace ContainerList {
			export type QueryParameters = any

			export namespace Responses {
				export type $200 = any
			}
		}

		export namespace ContainerDelete {
			export type PathParameters = any
			export type QueryParameters = any
		}
	}

	export namespace github {
		export namespace rest.components.Schemas {
			export type FullRepository = any;
		}

		export namespace rest.paths {
			export namespace ReposCreateForAuthenticatedUser {
				export namespace Responses {
					export type $201 = any
				}

				export type RequestBody = any
			}

			export namespace ReposListForAuthenticatedUser {
				export namespace Responses {
					export type $200 = any
				}

				export type QueryParameters = any
			}

			export namespace ReposGet {
				export namespace Responses {
					export type $200 = any
				}
			}

			export namespace ReposDelete {
				export namespace Responses {
					//export type $200 = any
					export type $204 = any
				}
			}
		}
	}
}
