import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { AskQuestionDto } from './dto/ask.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('suggested-questions')
  @RequirePermissions('insights.view')
  suggestedQuestions() {
    return this.insightsService.getSuggestedQuestions();
  }

  @Get('auto')
  @RequirePermissions('insights.view')
  auto() {
    return this.insightsService.getAutoInsights();
  }

  @Post('ask')
  @RequirePermissions('insights.ask')
  async ask(@Body() dto: AskQuestionDto) {
    const answer = await this.insightsService.ask(dto.question);
    return answer ?? { answer: null, message: 'Nenhuma resposta determinística disponível para esta pergunta.' };
  }
}
