import { Module } from '@nestjs/common';
import { AudienceService } from './audience/audience.service';
import { AudienceController } from './audience/audience.controller';
import { AccessService } from './access/access.service';
import { AccessController } from './access/access.controller';
import { ContentService } from './content/content.service';
import { ContentController } from './content/content.controller';
import { BeezzService } from './beezz/beezz.service';
import { BeezzController } from './beezz/beezz.controller';
import { EngagementService } from './engagement/engagement.service';
import { EngagementController } from './engagement/engagement.controller';
import { PodsService } from './pods/pods.service';
import { PodsController } from './pods/pods.controller';
import { DirectoryService } from './directory/directory.service';
import { DirectoryController } from './directory/directory.controller';
import { RecognitionService } from './recognition/recognition.service';
import { RecognitionController } from './recognition/recognition.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [AlertsModule, InsightsModule],
  controllers: [
    AudienceController,
    AccessController,
    ContentController,
    BeezzController,
    EngagementController,
    PodsController,
    DirectoryController,
    RecognitionController,
    DashboardController,
  ],
  providers: [
    AudienceService,
    AccessService,
    ContentService,
    BeezzService,
    EngagementService,
    PodsService,
    DirectoryService,
    RecognitionService,
    DashboardService,
  ],
})
export class AnalyticsModule {}
