import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { JournalCommentEntity } from '../../entities/journal-comment.entity';

const GYM_A = 'gym-a-uuid';
const GYM_B = 'gym-b-uuid';
const USER_ID = 'user-uuid';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn((entity: any) => {
    if (Array.isArray(entity)) return Promise.resolve(entity.map((e: any, i: number) => ({ id: `mock-${i}`, ...e })));
    return Promise.resolve({ id: 'mock-uuid', ...entity });
  }),
  create: jest.fn((entity: any) => entity),
  count: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('JournalService — cross-tenant isolation', () => {
  let service: JournalService;
  let journalRepo: ReturnType<typeof mockRepo>;
  let commentRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    journalRepo = mockRepo();
    commentRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: getRepositoryToken(JournalEntryEntity), useValue: journalRepo },
        { provide: getRepositoryToken(JournalCommentEntity), useValue: commentRepo },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
  });

  const sampleDto = {
    exploration: 'Worked on triangle chokes',
    challenge: 'Keeping elbows tight',
    worked: 'De la Riva sweeps',
    takeaways: 'Pressure is key',
    nextSession: 'Focus on grip strength',
    className: 'Advanced BJJ',
    discipline: 'bjj',
  };

  it('create saves journal entry with the correct gymId', async () => {
    const result = await service.create(GYM_A, USER_ID, sampleDto);

    expect(journalRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ gymId: GYM_A, userId: USER_ID }),
    );
    expect(journalRepo.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ gymId: GYM_A, userId: USER_ID }));
  });

  it('findAll returns only entries scoped to the requested gym', async () => {
    const gymAEntries = [
      { id: 'entry-1', gymId: GYM_A, userId: USER_ID, exploration: 'A' },
    ];
    journalRepo.find.mockResolvedValue(gymAEntries);

    const result = await service.findAll(GYM_A, USER_ID);

    expect(journalRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A, userId: USER_ID },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(gymAEntries);
  });

  it('findOne throws NotFoundException when entry exists in Gym A but is queried from Gym B', async () => {
    // Entry exists in Gym A but queried with Gym B — repo returns null
    journalRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(GYM_B, USER_ID, 'entry-in-gym-a')).rejects.toThrow(
      NotFoundException,
    );

    expect(journalRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'entry-in-gym-a', gymId: GYM_B, userId: USER_ID },
    });
  });

  it('update cannot update an entry from a different gym', async () => {
    // findOne will return null because gymId doesn't match
    journalRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(GYM_B, USER_ID, 'entry-in-gym-a', { exploration: 'hacked' }),
    ).rejects.toThrow(NotFoundException);

    // save should never be called for cross-gym update attempt
    expect(journalRepo.save).not.toHaveBeenCalled();
  });

  it('remove cannot remove an entry from a different gym', async () => {
    journalRepo.findOne.mockResolvedValue(null);

    await expect(
      service.remove(GYM_B, USER_ID, 'entry-in-gym-a'),
    ).rejects.toThrow(NotFoundException);

    expect(journalRepo.remove).not.toHaveBeenCalled();
  });

  it('getComments only returns comments scoped to the requesting gym', async () => {
    const entry = { id: 'entry-1', gymId: GYM_A, userId: USER_ID };
    journalRepo.findOne.mockResolvedValue(entry);

    const gymAComments = [
      { id: 'c1', gymId: GYM_A, journalEntryId: 'entry-1', authorId: 'coach-1', content: 'Good work', createdAt: new Date(), author: { name: 'Coach Sarah', role: 'coach' } },
    ];
    commentRepo.find.mockResolvedValue(gymAComments);

    const result = await service.getComments(GYM_A, USER_ID, 'entry-1');

    expect(commentRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A, journalEntryId: 'entry-1' },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].authorName).toBe('Coach Sarah');
  });

  it('same user can have journal entries in different gyms without conflict', async () => {
    // Create entry in Gym A
    journalRepo.save.mockResolvedValueOnce({ id: 'entry-gym-a', gymId: GYM_A, userId: USER_ID, ...sampleDto });
    const entryA = await service.create(GYM_A, USER_ID, sampleDto);

    // Create entry in Gym B
    journalRepo.save.mockResolvedValueOnce({ id: 'entry-gym-b', gymId: GYM_B, userId: USER_ID, ...sampleDto });
    const entryB = await service.create(GYM_B, USER_ID, sampleDto);

    expect(entryA.gymId).toBe(GYM_A);
    expect(entryB.gymId).toBe(GYM_B);
    expect(entryA.id).not.toBe(entryB.id);

    // Verify create was called with different gymIds
    expect(journalRepo.create).toHaveBeenCalledWith(expect.objectContaining({ gymId: GYM_A }));
    expect(journalRepo.create).toHaveBeenCalledWith(expect.objectContaining({ gymId: GYM_B }));
  });

  it('getComments query includes gymId filter in the comment repo query', async () => {
    const entry = { id: 'entry-1', gymId: GYM_A, userId: USER_ID };
    journalRepo.findOne.mockResolvedValue(entry);
    commentRepo.find.mockResolvedValue([]);

    await service.getComments(GYM_A, USER_ID, 'entry-1');

    // Verify the comments query explicitly includes gymId
    const findCall = commentRepo.find.mock.calls[0][0];
    expect(findCall.where).toHaveProperty('gymId', GYM_A);
    expect(findCall.where).toHaveProperty('journalEntryId', 'entry-1');
  });
});
