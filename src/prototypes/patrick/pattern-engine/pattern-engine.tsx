/** @studio-id tc3b4fm8y98jv6nx */
import { useSearchParams } from '@module/prototypes';
import PatternEngineTool from './_components/PatternEngineTool';

// Pattern Engine: the editor for the generative art engine in @itspatmorgan/kit, which draws every article's visual on
// itspatmorgan.com. Each article's visual links here with its settings in the address (bg, generator, seed, and the
// generator's own values), so the editor opens on that article's art. A new link starts the editor over.
export default function PatternEngine() {
  const search = useSearchParams();
  return (
    <div className="h-dvh [--pattern-engine-height:100dvh]">
      <PatternEngineTool key={search.toString()} search={search} />
    </div>
  );
}
