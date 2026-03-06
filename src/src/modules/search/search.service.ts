import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private client: Client | null = null;
  private readonly indexName = 'products';

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>('ELASTICSEARCH_NODE');
    if (node) {
      this.client = new Client({ node });
    } else {
      this.logger.warn('ELASTICSEARCH_NODE not configured. Search is operating in local mock mode.');
    }
  }

  async indexProduct(product: any): Promise<void> {
    if (!this.client) return; // Mock exit
    try {
      await this.client.index({
        index: this.indexName,
        id: product.id,
        document: {
          title: product.title,
          description: product.description,
          product_type: product.product_type,
          price: product.price,
          tags: product.tags,
        },
      });
      this.logger.log(`Indexed product ${product.id} in ES`);
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}: ${error.message}`);
    }
  }

  async searchProducts(query: string) {
    if (!this.client) {
      return { hits: { hits: [{ _source: { title: 'Mock Search Result', price: 9.99 } }] } };
    }

    try {
      const result = await this.client.search({
        index: this.indexName,
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'description', 'tags'],
          },
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`);
      return { hits: { hits: [] } };
    }
  }
}
