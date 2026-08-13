import { GlobalFilters } from "@/types/filters";
import { Collaborator } from "@/types/user";

export interface DirectoryData {
  people: Collaborator[];
  partialCoverage?: boolean;
}

export interface IDirectoryRepository {
  getDirectory(filters: GlobalFilters, search: string): Promise<DirectoryData>;
}
