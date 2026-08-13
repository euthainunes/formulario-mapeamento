import { IDirectoryRepository, DirectoryData } from "@/services/contracts/directory.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { filterCollaborators } from "@/mocks/audience.mock";

export class MockDirectoryRepository implements IDirectoryRepository {
  async getDirectory(filters: GlobalFilters, search: string): Promise<DirectoryData> {
    let people = filterCollaborators(filters);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      people = people.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.jobTitle.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return delay({ people, partialCoverage: chance(0.08) });
  }
}
