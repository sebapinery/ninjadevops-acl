import { DynamicModule, Global, Module } from '@nestjs/common';
import { ACL_OPTIONS } from './acl.const';
import { OptionsAccessControl } from './acl.interfaces';
import { AccessControlService } from './acl.provider';

@Global()
@Module({})
export class AccessControlModule {
  static forRoot(options: OptionsAccessControl): DynamicModule {
    return {
      module: AccessControlModule,
      providers: [
        {
          provide: ACL_OPTIONS,
          useValue: options,
        },
        AccessControlService,
      ],
      exports: [AccessControlService],
    };
  }
}
