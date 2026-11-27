import { VOLUME_NORMAL, volumeDriveAmount } from '../lib/audio'

type VolumeSliderProps = {
  value: number
  onChange: (value: number) => void
}

export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  const drive = volumeDriveAmount(value)
  const ultra = drive > 0.55
  const label =
    value <= 0.08 ? 'Quiet' : value <= VOLUME_NORMAL + 0.02 ? 'Normal' : ultra ? 'Ultra loud' : 'Loud'

  return (
    <div className={`volume-slider ${ultra ? 'volume-slider--ultra' : ''}`}>
      <div className="volume-slider__labels">
        <span>Normal</span>
        <strong>{label}</strong>
        <span>Ultra loud</span>
      </div>
      <input
        type="range"
        className="volume-slider__input"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label="Playback volume from Normal to Ultra loud"
        aria-valuetext={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <p className="volume-slider__hint">
        {ultra
          ? 'Ultra loud drives gain hard — distortion is intentional for outdoor / thrown-speaker use.'
          : 'Default is a comfortable loud level. Drag right only when you need outdoor throw volume.'}
      </p>
    </div>
  )
}
