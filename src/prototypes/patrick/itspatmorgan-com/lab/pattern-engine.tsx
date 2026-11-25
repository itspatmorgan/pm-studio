/** @studio-id 5jhe26hn9xwqv00q */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from '@module/prototypes';

// itspatmorgan.com/lab/pattern-engine moves to Studio: Pattern Engine is its own prototype now. Like the site's redirect,
// this page opens it, keeping any settings in the address.
const PATTERN_ENGINE = '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx';

export default function PatternEngine() {
  const navigate = useNavigate();
  const search = useSearchParams().toString();
  useEffect(() => navigate(`${PATTERN_ENGINE}${search ? `?${search}` : ''}`), [navigate, search]);
  return null;
}
