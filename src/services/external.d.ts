/* Do not change, this code is generated from Golang structs */


export type ListOptions = {
    pagination?: string;
    per_page?: number;
    page?: number;
    page_token?: string;
    order_by?: string;
    sort?: string;
}
export type APIResource = {
    name: string;
    singularName: string;
    namespaced: boolean;
    group?: string;
    version?: string;
    kind: string;
    verbs: string[];
    shortNames?: string[];
    categories?: string[];
    storageVersionHash?: string;
}
export type Verbs = {

}
export type LicenseData = {
    product: string;
    github: string;
    issuer: string;
    issuerEmail: string;
    issuerPhone: string;
    website: string;
    company: string;
    email: string;
    type: string;
    issuedAt: string;
    expiresAt: string;
    serialNumber: string;
    maxClusters: number;
    maxUsers: number;
    currentUsers: number;
    currentClusters: number;
    message: string;
}