import { MovedPage, movedMetadata } from '@/components/moved-page';

const TO = '/docs/colors';

export const metadata = movedMetadata(TO, 'Tokens');

export default function TokensMoved() {
  return <MovedPage to={TO} title="Tokens" />;
}
