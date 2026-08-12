import { MovedPage, movedMetadata } from '@/components/moved-page';

const TO = '/docs/components';

export const metadata = movedMetadata(TO, 'Components');

export default function ComponentsMoved() {
  return <MovedPage to={TO} title="Components" />;
}
