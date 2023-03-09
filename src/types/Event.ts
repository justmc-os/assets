import WithId from './WithId';
import WithMetadata from './WithMetadata';

type Event = WithId &
  WithMetadata & {
    cancellable: boolean;
  };

export default Event;
