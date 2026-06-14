import { OrganizationRepository, Organization } from '../repositories/OrganizationRepository.js';

export class OrgError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'OrgError';
  }
}

export class OrganizationService {
  constructor(private orgRepo: OrganizationRepository) {}

  async getOrganization(orgId: number): Promise<Organization> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new OrgError('Organization not found', 404);
    return org;
  }

  async updateProfile(orgId: number, data: { name: string; address: string; contactPhone: string; contactEmail: string }): Promise<Organization> {
    const org = await this.orgRepo.updateProfile(orgId, data);
    if (!org) throw new OrgError('Organization not found', 404);
    return org;
  }

  async getCourses(orgId: number, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;
    return this.orgRepo.getOrgCourses(orgId, { archived: false, limit: safeLimit, offset });
  }

  async getArchivedCourses(orgId: number) {
    return this.orgRepo.getOrgCourses(orgId, { archived: true, limit: 500, offset: 0 });
  }

  async listOrganizations(options: { search?: string; page: number; limit: number }) {
    const safeLimit = Math.min(options.limit, 100);
    const offset = (options.page - 1) * safeLimit;
    return this.orgRepo.findWithStats({ search: options.search, limit: safeLimit, offset });
  }
}
