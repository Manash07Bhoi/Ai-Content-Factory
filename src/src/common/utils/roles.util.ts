import { Role } from '../../common/enums/role.enum';

export class RolesHierarchy {
  private static readonly hierarchy = [
    Role.CUSTOMER,
    Role.REVIEWER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ];

  static atLeast(minRole: Role): Role[] {
    const startIndex = this.hierarchy.indexOf(minRole);
    if (startIndex === -1) {
      return [];
    }
    return this.hierarchy.slice(startIndex);
  }
}
