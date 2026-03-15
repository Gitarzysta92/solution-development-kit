import { EventEnvelope } from '@sdk/kernel/aspects/events';

/**
 * Queue and message contract used to request discussion projection/materialization.
 */
export const DISCUSSION_PROJECTION_QUEUE_NAME = 'discussion-projection';

export type DiscussionMaterializationRequestedEvent = EventEnvelope<
  'discussion.materialization.requested',
  { discussionId: string }
>;
