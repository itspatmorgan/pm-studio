/** @studio-id 6zehwjfdr89hsfzs */
import { CasePiece, PatternEnginePiece, PixelMarkPiece, PixelWavePiece } from './_components/pieces';

// The other direction: Snapshots as a full-screen reel. One piece fills the screen at a time and the page snaps from
// piece to piece as you scroll, so each one gets the whole stage.
const slide = 'h-dvh w-full snap-start rounded-none ring-0 hover:ring-0';
export default function SnapshotsReel() {
  return (
    <div className="h-dvh snap-y snap-mandatory overflow-y-auto bg-background text-foreground">
      <PatternEnginePiece className={slide} />
      <PixelWavePiece className={slide} text="Designer who builds." />
      <div className="flex h-dvh snap-start items-center justify-center p-4 sm:p-10">
        <CasePiece id="sublime" className="w-full max-w-[72rem]" />
      </div>
      <div className="flex h-dvh snap-start items-center justify-center p-4 sm:p-10">
        <CasePiece id="design-studio" className="w-full max-w-[72rem]" />
      </div>
      <PixelMarkPiece className={slide} />
      <div className="flex h-dvh snap-start items-center justify-center p-4 sm:p-10">
        <CasePiece id="expansion" className="w-full max-w-[72rem]" />
      </div>
      <div className="flex h-dvh snap-start items-center justify-center p-4 sm:p-10">
        <CasePiece id="query-builder" className="w-full max-w-[72rem]" />
      </div>
    </div>
  );
}
