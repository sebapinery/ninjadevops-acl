export interface Grants {
  [key: string]: any;
}

export interface OptionsAccessControl {
  roles: Array<string>;
  grants: Grants;
}
