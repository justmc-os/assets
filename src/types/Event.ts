import WithId from './WithId';
import WithMetadata from './WithMetadata';

type Event = WithId &
  WithMetadata & {
    category: string;
    cancellable: boolean;
  };

export default Event;
