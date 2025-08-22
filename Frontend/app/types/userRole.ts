export type UserRole = 'admin' | 'owner' | 'developer';

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}
