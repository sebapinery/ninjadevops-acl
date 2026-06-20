import { AccessControlService } from './acl.provider';
import { OptionsAccessControl } from './acl.interfaces';
import { Action, Possessions } from './enum';

describe('AclProvider', () => {
  it('should be defined', () => {
    const accessControlConfig: OptionsAccessControl = {
      grants: {
        admin: {
          mock: {
            [`${Action.READ}:${Possessions.ANY}`]: ['*'],
          },
        },
      },
      roles: ['admin'],
    };

    expect.assertions(2);

    const acl = new AccessControlService(accessControlConfig);

    expect(acl).toBeInstanceOf(AccessControlService);
    expect(acl).toBeDefined();
  });

  it('invalid accessControlConfig', () => {
    const accessControlConfigInvalid: OptionsAccessControl = {
      grants: {
        admin: {
          mock: {
            [`read:any`]: ['*'],
          },
        },
      },
      roles: ['admin', 'other'],
    };

    expect.assertions(1);

    try {
      const acl = new AccessControlService(accessControlConfigInvalid);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
