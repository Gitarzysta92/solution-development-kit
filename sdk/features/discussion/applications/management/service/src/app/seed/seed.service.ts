import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { ContentNodeEntity } from '../discussions/infrastructure/content-node.entity';
import { ContentNodeState, ContentNodeVisibility } from '@sdk/kernel/ontology/content';
import { Uuidv7, isErr } from '@sdk/kernel/standard';
import { DiscussionsService } from '../discussions/discussions.service';

/** Seed-only DTOs for demo discussion content (no dependency on catalog/domains). */
interface SeedTagOption {
  id: number;
  name: string;
  slug: string;
}
interface SeedCategoryTree {
  id: number;
  slug: string;
  name: string;
  childs: SeedCategoryTree[];
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(ContentNodeEntity)
    private contentNodeRepo: Repository<ContentNodeEntity>,
    private readonly discussionsService: DiscussionsService,
  ) {}

  async seed() {
    try {
      const totalNodes = await this.contentNodeRepo.count();
      this.logger.log(`🌱 Seed check: content_nodes count=${totalNodes}`);

      await this.seedSystemNodes();
      await this.seedDemoDiscussionIfEnabled();

      this.logger.log('✅ Seeding completed');
    } catch (error) {
      this.logger.error('❌ Error during seeding:', error);
    }
  }

  private async seedSystemNodes() {
    this.logger.log('Seeding system content nodes...');
    const timestamp = Date.now();
    const systemNode = this.contentNodeRepo.create({
      id: this.buildSeedUuid('system-node'),
      referenceKey: this.buildSeedUuid('system-node-ref'),
      kind: 'system',
      state: ContentNodeState.PUBLISHED,
      visibility: ContentNodeVisibility.PUBLIC,
      createdAt: timestamp,
    });

    await this.contentNodeRepo.upsert(systemNode, ['id']);
    this.logger.log('✅ Seeded system content node');
  }

  private async seedDemoDiscussionIfEnabled() {
    const enabled = (process.env.DISCUSSION_SEED_DEMO_DATA || '').toLowerCase() === 'true';
    if (!enabled) {
      return;
    }

    this.logger.log('🌱 Seeding demo discussion payload...');

    const seedContent = this.buildSeedContent();
    const payload = {
      id: this.buildSeedUuid('demo-discussion'),
      referenceKey: this.buildSeedUuid('demo-discussion-ref'),
      content: seedContent,
    };

    const ctx = {
      identityId: 'seed',
      tenantId: 'default',
      timestamp: Date.now(),
    };

    const result = await this.discussionsService.create(payload, ctx);
    if (isErr(result)) {
      if (this.isDuplicateError(result.error)) {
        this.logger.log('✅ Demo discussion already seeded, skipping...');
        return;
      }
      this.logger.error('❌ Demo discussion seed failed', result.error);
      return;
    }

    this.logger.log('✅ Seeded demo discussion');
  }

  private buildSeedContent(): Record<string, unknown> {
    const fallbackTags: SeedTagOption[] = [
      { id: 0, name: 'Discussion', slug: 'discussion' },
      { id: 1, name: 'Community', slug: 'community' },
      { id: 2, name: 'Feedback', slug: 'feedback' },
    ];
    const fallbackCategories: SeedCategoryTree[] = [
      { id: 0, slug: 'general', name: 'General', childs: [] },
    ];

    const leafCategories = this.flattenCategories(fallbackCategories);
    const selectedCategory = leafCategories[0] ?? fallbackCategories[0];
    const selectedTags = fallbackTags.slice(0, 3);

    return {
      type: 'seed',
      title: `Seeded discussion: ${selectedCategory.name}`,
      text:
        'This discussion was seeded with demo data. Set DISCUSSION_SEED_DEMO_DATA=false to disable.',
      category: {
        id: selectedCategory.id,
        slug: selectedCategory.slug,
        name: selectedCategory.name,
      },
      tags: selectedTags.map((tag) => ({ id: tag.id, slug: tag.slug, name: tag.name })),
    };
  }

  private flattenCategories(nodes: SeedCategoryTree[]): Array<Pick<SeedCategoryTree, 'id' | 'slug' | 'name'>> {
    const result: Array<Pick<SeedCategoryTree, 'id' | 'slug' | 'name'>> = [];
    for (const node of nodes) {
      if (Array.isArray(node.childs) && node.childs.length > 0) {
        result.push(...this.flattenCategories(node.childs));
      } else {
        result.push({ id: node.id, slug: node.slug, name: node.name });
      }
    }
    return result;
  }

  private buildSeedUuid(name: string): Uuidv7 {
    return uuidv5(`discussion:${name}`, uuidv5.DNS) as Uuidv7;
  }

  private isDuplicateError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const code = (error as { code?: string }).code;
    const errno = (error as { errno?: number }).errno;
    const message = (error as { message?: string }).message;
    return code === 'ER_DUP_ENTRY' || errno === 1062 || !!message?.includes('Duplicate entry');
  }
}
