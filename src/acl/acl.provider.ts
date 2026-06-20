import { Inject, Injectable } from '@nestjs/common';
import { AccessControl } from 'accesscontrol';
import { ACL_OPTIONS } from './acl.const';
import { Grants, OptionsAccessControl } from './acl.interfaces';

@Injectable()
export class AccessControlService extends AccessControl {
  constructor(@Inject(ACL_OPTIONS) { grants, roles }: OptionsAccessControl) {
    super(grants);
    this.checkImplementation(grants, roles);
  }

  private checkImplementation(grantsConfig: Grants, roles: Array<string>): void {
    Object.values(roles).forEach((role) => {
      if (!grantsConfig[role])
        throw new Error(`Rol "${role}" It must be implemented in the acl rules`);
    });
  }
}
