import { Test, TestingModule } from '@nestjs/testing';
import { LLMClientService } from './llm-client.service';
import { ConfigService } from '@nestjs/config';

describe('LLMClientService', () => {
  let service: LLMClientService;
  let configService: ConfigService;

  beforeEach(async () => {
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined; // No API keys initially
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMClientService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<LLMClientService>(LLMClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should fallback to mock if openai API key is missing', async () => {
    const result = await service.generate({
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt: 'sys',
      userPrompt: 'user',
    });

    expect(result.provider).toBe('mock-openai');
    expect(result.content).toContain('Mock generated prompt');
  });

  it('should fallback to mock if anthropic API key is missing', async () => {
    const result = await service.generate({
      provider: 'anthropic',
      model: 'claude-3',
      systemPrompt: 'sys',
      userPrompt: 'user',
    });

    expect(result.provider).toBe('mock-anthropic');
    expect(result.content).toContain('Mock generated prompt');
  });
});
