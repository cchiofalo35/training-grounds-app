import { NotFoundException } from '@nestjs/common';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { GymEntity } from '../../entities/gym.entity';

describe('GymController — getTheme', () => {
  let controller: GymController;
  let gymService: Partial<GymService>;

  const trainingGroundsGym: Partial<GymEntity> = {
    id: 'gym-1',
    slug: 'training-grounds',
    primaryColor: '#C9A87C',
    secondaryColor: '#1E1E1E',
    surfaceColor: '#2A2A2A',
    textPrimary: '#FAFAF8',
    textMuted: '#B0B5B8',
    headingFont: 'Bebas Neue',
    bodyFont: 'Inter',
    logoUrl: 'https://cdn.example.com/tg-logo.png',
  };

  const ironLionGym: Partial<GymEntity> = {
    id: 'gym-2',
    slug: 'iron-lion-mma',
    primaryColor: '#E74C3C',
    secondaryColor: '#0D1117',
    surfaceColor: '#161B22',
    textPrimary: '#F0F6FC',
    textMuted: '#8B949E',
    headingFont: 'Oswald',
    bodyFont: 'Roboto',
    logoUrl: null,
  };

  beforeEach(() => {
    gymService = {
      findBySlug: jest.fn().mockImplementation((slug: string) => {
        if (slug === 'training-grounds') return Promise.resolve(trainingGroundsGym);
        if (slug === 'iron-lion-mma') return Promise.resolve(ironLionGym);
        throw new NotFoundException(`Gym with slug "${slug}" not found`);
      }),
    };
    controller = new GymController(gymService as GymService);
  });

  it('should return all expected theme fields including new surface/text colors', async () => {
    const result = await controller.getTheme('training-grounds');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      primaryColor: '#C9A87C',
      secondaryColor: '#1E1E1E',
      surfaceColor: '#2A2A2A',
      textPrimary: '#FAFAF8',
      textMuted: '#B0B5B8',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
      logoUrl: 'https://cdn.example.com/tg-logo.png',
    });
  });

  it('should return different theme values for second gym', async () => {
    const result = await controller.getTheme('iron-lion-mma');

    expect(result.success).toBe(true);
    expect(result.data.primaryColor).toBe('#E74C3C');
    expect(result.data.surfaceColor).toBe('#161B22');
    expect(result.data.textPrimary).toBe('#F0F6FC');
    expect(result.data.textMuted).toBe('#8B949E');
    expect(result.data.headingFont).toBe('Oswald');
    expect(result.data.bodyFont).toBe('Roboto');
    expect(result.data.logoUrl).toBeNull();

    // Verify values differ from Training Grounds
    const tgResult = await controller.getTheme('training-grounds');
    expect(result.data.surfaceColor).not.toBe(tgResult.data.surfaceColor);
    expect(result.data.textPrimary).not.toBe(tgResult.data.textPrimary);
    expect(result.data.textMuted).not.toBe(tgResult.data.textMuted);
  });

  it('should throw NotFoundException for nonexistent slug', async () => {
    await expect(controller.getTheme('nonexistent-gym')).rejects.toThrow(NotFoundException);
  });
});
