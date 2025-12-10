import zod from 'zod';

export const updateBookmarkNoteSchema = zod.object({
    note: zod.string().max(500, 'Note must be at most 500 characters long'),
});
