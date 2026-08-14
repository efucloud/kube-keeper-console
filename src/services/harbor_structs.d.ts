// The storage quota of the project.
export type GetArtifactParams = { 
  page?: number;
  pageSize?: number;
  /* ProjectName.

	   The name of the project
	*/
  projectName?: string;
  /* Reference.

	   The reference of the artifact, can be digest or tag
	*/
  reference?: string;
  /* RepositoryName.

	   The name of the repository. If it contains slash, encode it twice over with URL encoding. e.g. a/b -> a%2Fb -> a%252Fb
	*/
  repositoryName?: string;
  /* WithAccessory.

	   Specify whether the accessories are included of the returning artifacts.
	*/
  withAccessory: boolean;
  /* WithImmutableStatus.

	   Specify whether the immutable status is inclued inside the tags of the returning artifacts.
	*/
  withImmutableStatus: boolean;
  /* WithLabel.

	   Specify whether the labels are inclued inside the returning artifacts
	*/
  withLabel: boolean;
  /* WithScanOverview.

	   Specify whether the scan overview is inclued inside the returning artifacts
	*/
  withScanOverview: boolean;
  /* WithSignature.

	   Specify whether the signature is inclued inside the returning artifacts
	*/
  withSignature: boolean;
  /* WithTag.

	   Specify whether the tags are inclued inside the returning artifacts

	   Default: true
	*/
  withTag: boolean;
} ; 
export type ListProjectsParams = { 
  name?: string;
  owner?: string;
  page?: number;
  pageSize?: number;
  public: boolean;
  //Query string to query resources. Supported query patterns are "exact match(k=v)", "fuzzy match(k=~v)", "range(k=[min~max])", "list with union releationship(k={v1 v2 v3})" and "list with intersetion relationship(k=(v1 v2 v3))". The value of range and list can be string(enclosed by " or '), integer or time(in format "2020-04-09 02:36:00"). All of these query patterns should be put in the query string "q=xxx" and splitted by ",". e.g. q=k1=v1,k2=~v2,k3=[min~max]
  q?: string;
  //排序：sort=field1,-field2
  sort?: string;
} ; 
//排序：sort=field1,-field2
export type ProjectReq = { 
  // The CVE allowlist of the project.
  auto_scan?: string;
  // The name of the project.
  // Max Length: 255
  project_name?: string;
  // deprecated, reserved for project creation in replication
  public?: boolean;
  // The storage quota of the project.
  storage_limit?: number;
} ; 
export type RegistryAuth = { 
  username?: string;
  password?: string;
} ; 
