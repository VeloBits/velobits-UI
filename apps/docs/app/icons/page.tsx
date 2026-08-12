import { MovedPage, movedMetadata } from '@/components/moved-page';

const TO = '/docs/icons';

export const metadata = movedMetadata(TO, 'Icons');

export default function IconsMoved() {
  return <MovedPage to={TO} title="Icons" />;
}
