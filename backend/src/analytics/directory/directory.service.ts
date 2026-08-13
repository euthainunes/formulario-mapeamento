import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { toCollaboratorDto } from '../collaborator.mapper';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDirectory(filters: GlobalFiltersDto, search: string) {
    const people = await this.prisma.user.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(filters.company ? { company: { name: filters.company } } : {}),
        ...(filters.department ? { department: { name: filters.department } } : {}),
        ...(filters.jobTitle ? { jobTitle: { name: filters.jobTitle } } : {}),
        ...(filters.team ? { team: { name: filters.team } } : {}),
      },
      include: { company: true, department: true, jobTitle: true, team: true },
      take: 200,
      orderBy: { name: 'asc' },
    });

    return {
      people: people.map(toCollaboratorDto),
      partialCoverage: false,
    };
  }
}
