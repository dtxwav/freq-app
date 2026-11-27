export type Confidence = 'research' | 'mixed' | 'experimental' | 'myth'

export type SoundZone = 'attract' | 'lure' | 'deter' | 'edu'

export type ContentType = 'synth-tone' | 'synth-sweep' | 'bio-approx' | 'voice-approx'

export type ToneKind =
  | 'kitten-call'
  | 'soft-kitten'
  | 'prey-chirp'
  | 'mouse-squeak'
  | 'food-cue'
  | 'kibble-shake'
  | 'pspsps'
  | 'cat-trill'
  | 'cat-mid-beep'
  | 'tom-growl'
  | 'hiss-burst'
  | 'dog-bark-cue'
  | 'human-hey'
  | 'ultrasonic-try'
  | 'puppy-distress'
  | 'attention-whistle'
  | 'squeaky-toy'
  | 'treat-bag'
  | 'click-tsk'
  | 'pack-howl'
  | 'bark-interrupt'
  | 'loud-startle'
  | 'deter-burst'
  | 'human-voice-burst'
  | 'aggressive-yell'
  | 'air-horn'
  | 'warble-siren'
  | 'metal-clang'
  | 'mosquito-wbf'
  | 'mosquito-15k'
  | 'hive-hum'
  | 'tanging-clang'
  | 'stop-signal-edu'

export type SoundIcon =
  | 'kitten'
  | 'bird'
  | 'can'
  | 'mouse'
  | 'bag'
  | 'pspsps'
  | 'trill'
  | 'tone'
  | 'tom'
  | 'hiss'
  | 'bark'
  | 'hey'
  | 'x'
  | 'yelp'
  | 'whistle'
  | 'squeak'
  | 'click'
  | 'howl'
  | 'burst'
  | 'voice'
  | 'horn'
  | 'siren'
  | 'clang'
  | 'wave'
  | 'buzz'
  | 'hive'

export type SoundCue = {
  id: string
  label: string
  intent: string
  zone: SoundZone
  confidence: Confidence
  note: string
  tone: ToneKind
  icon: SoundIcon
  contentType: ContentType
  hzLabel?: string
}

export type AnimalId = 'cats' | 'dogs' | 'bears' | 'mosquitoes' | 'bees'

export type Animal = {
  id: AnimalId
  name: string
  tagline: string
  framing: string
  accent: string
  attractLabel: string
  lureLabel: string
  deterLabel: string
  emptyAttractMessage?: string
  emptyLureMessage?: string
  emptyDeterMessage?: string
  safetyNote?: string
  educationOnly?: boolean
  sounds: SoundCue[]
}

export const CONFIDENCE_COPY: Record<
  Confidence,
  { label: string; detail: string }
> = {
  research: {
    label: 'Research',
    detail: 'Supported by published work or agency guidance — still not a guarantee.',
  },
  mixed: {
    label: 'Mixed',
    detail: 'Some studies or strong practice; results vary by animal and context.',
  },
  experimental: {
    label: 'Experimental',
    detail: 'Plausible cue or phone-limited approximation; evidence is thin.',
  },
  myth: {
    label: 'Myth',
    detail: 'Popular claim contradicted or unsupported — educational demo only.',
  },
}

export const CONTENT_TYPE_COPY: Record<ContentType, string> = {
  'synth-tone': 'Generated tone',
  'synth-sweep': 'Generated sweep',
  'bio-approx': 'Synthesized biological cue',
  'voice-approx': 'Synthesized voice-like cue',
}

export const animals: Animal[] = [
  {
    id: 'cats',
    name: 'Cats',
    tagline: 'Attract, lure, or discourage',
    framing:
      'Attract cues summon or soothe near you. Lure cues (kitten distress, prey) are for a thrown / Bluetooth speaker set away so the cat investigates that spot. Red cues interrupt — human voice beats phone ultrasonics.',
    accent: '#2F7D57',
    attractLabel: 'Attract / appease',
    lureLabel: 'Lure toward speaker',
    deterLabel: 'Deter / displease',
    sounds: [
      {
        id: 'cat-soft',
        label: 'Quiet kitten reply',
        intent: 'Gentler social approach near you',
        zone: 'attract',
        confidence: 'mixed',
        note: 'Lower-arousal alternative when distress-style mews feel too sharp.',
        tone: 'soft-kitten',
        icon: 'kitten',
        contentType: 'bio-approx',
        hzLabel: '~1–2 kHz',
      },
      {
        id: 'cat-food',
        label: 'Dinner can opens',
        intent: 'Conditioned mealtime summon',
        zone: 'attract',
        confidence: 'research',
        note: 'Learned can-pop association — reliable for many house cats.',
        tone: 'food-cue',
        icon: 'can',
        contentType: 'bio-approx',
        hzLabel: 'broadband',
      },
      {
        id: 'cat-kibble',
        label: 'Treat bag shake',
        intent: 'Bag/bowl rustle meal cue',
        zone: 'attract',
        confidence: 'mixed',
        note: 'Owner folklore staple for both cats and dogs.',
        tone: 'kibble-shake',
        icon: 'bag',
        contentType: 'bio-approx',
        hzLabel: 'crinkle band',
      },
      {
        id: 'cat-pspsps',
        label: 'Pspsps come here',
        intent: 'High “s” tongue-click summon',
        zone: 'attract',
        confidence: 'mixed',
        note: 'Cultural summon; often framed as prey-like high consonants.',
        tone: 'pspsps',
        icon: 'pspsps',
        contentType: 'synth-tone',
        hzLabel: '~2.6–3.3 kHz',
      },
      {
        id: 'cat-trill',
        label: 'Friendly trill hello',
        intent: 'Short social approach sound',
        zone: 'attract',
        confidence: 'experimental',
        note: 'Friendly cat-to-cat / cat-to-human greeting approximation.',
        tone: 'cat-trill',
        icon: 'trill',
        contentType: 'bio-approx',
        hzLabel: '~500–900 Hz',
      },
      {
        id: 'cat-13k',
        label: '13 kHz investigate beep',
        intent: 'Generated mid-high tone some ferals investigated',
        zone: 'attract',
        confidence: 'experimental',
        note: 'Papers note visits near ~13 kHz — weak as a pet-attraction claim.',
        tone: 'cat-mid-beep',
        icon: 'tone',
        contentType: 'synth-tone',
        hzLabel: '~13 kHz',
      },
      {
        id: 'cat-kitten',
        label: 'Mama runs to kittens',
        intent: 'Kitten distress mew — place speaker away to pull interest',
        zone: 'lure',
        confidence: 'research',
        note: 'Strongest YouTube/Reddit “came running” cluster (~1–2.5 kHz F0). Set the speaker where you want the cat, not at your feet. Stop if stressed.',
        tone: 'kitten-call',
        icon: 'kitten',
        contentType: 'bio-approx',
        hzLabel: '~1–2.5 kHz',
      },
      {
        id: 'cat-mouse',
        label: 'Mouse in the wall',
        intent: 'Rodent-prey squeak toward a remote speaker',
        zone: 'lure',
        confidence: 'mixed',
        note: 'Comment-backed hunt/approach interest; feral-cat lure work favors natural prey audio over beeps.',
        tone: 'mouse-squeak',
        icon: 'mouse',
        contentType: 'bio-approx',
        hzLabel: '~4–5 kHz',
      },
      {
        id: 'cat-bird',
        label: 'Bird at the window',
        intent: 'Hunting interest — distract toward the speaker',
        zone: 'lure',
        confidence: 'mixed',
        note: 'Prey-like chirps often hold investigation longer than plain beeps. Throw/Bluetooth speaker use.',
        tone: 'prey-chirp',
        icon: 'bird',
        contentType: 'bio-approx',
        hzLabel: 'broadband mid',
      },
      {
        id: 'cat-hey',
        label: 'Hey! get out',
        intent: 'Spoken threat / risk cue',
        zone: 'deter',
        confidence: 'research',
        note: 'Best phone-feasible aversive in tracked playback work; outperforms dog/cat competitor cues at food patches.',
        tone: 'human-hey',
        icon: 'hey',
        contentType: 'voice-approx',
        hzLabel: '~0.3–1.1 kHz speech energy',
      },
      {
        id: 'cat-tom',
        label: 'Tom next door',
        intent: 'Competing tom yowl / growl interrupt',
        zone: 'deter',
        confidence: 'mixed',
        note: 'Agonistic male cue — may displace or stress residents; keep bursts short.',
        tone: 'tom-growl',
        icon: 'tom',
        contentType: 'bio-approx',
        hzLabel: '~70–110 Hz',
      },
      {
        id: 'cat-hiss',
        label: 'Angry hiss',
        intent: 'Defensive interrupt',
        zone: 'deter',
        confidence: 'experimental',
        note: 'Ethology-backed warning display; weaker open-web “worked” comments than kitten attract. Habituates if looped.',
        tone: 'hiss-burst',
        icon: 'hiss',
        contentType: 'bio-approx',
        hzLabel: 'noise burst',
      },
      {
        id: 'cat-bark',
        label: 'Dog in the yard',
        intent: 'Competitor predator-like cue',
        zone: 'deter',
        confidence: 'mixed',
        note: 'Some food-patch deterrence; weaker than human voice.',
        tone: 'dog-bark-cue',
        icon: 'bark',
        contentType: 'bio-approx',
        hzLabel: 'bark band',
      },
      {
        id: 'cat-ultra',
        label: 'Ultrasonic myth try',
        intent: 'Phone-limited near-ultrasound — does not “work” as sold',
        zone: 'deter',
        confidence: 'myth',
        note: 'Comment skepticism + phone speaker limits. Garden ultrasonics need hardware. Demo only.',
        tone: 'ultrasonic-try',
        icon: 'x',
        contentType: 'synth-tone',
        hzLabel: '~9–12 kHz stand-in',
      },
    ],
  },
  {
    id: 'dogs',
    name: 'Dogs',
    tagline: 'Call, lure, or interrupt',
    framing:
      'Attract = trained recall and treat cues near you. Lure = puppy distress, squeaky prey-play, pack howl on a speaker placed away. Ultrasonic “bark stop” on phones stays myth/weak.',
    accent: '#3B6EA5',
    attractLabel: 'Attract / recall',
    lureLabel: 'Lure toward speaker',
    deterLabel: 'Deter / interrupt',
    sounds: [
      {
        id: 'dog-whistle',
        label: 'Whistle, then treats',
        intent: 'Recall whistle — works after training',
        zone: 'attract',
        confidence: 'mixed',
        note: 'Not magic without conditioning. Pair pips with rewards until “comes like a bullet.”',
        tone: 'attention-whistle',
        icon: 'whistle',
        contentType: 'synth-tone',
        hzLabel: '~5–16 kHz',
      },
      {
        id: 'dog-treat',
        label: 'Treat bag crinkle',
        intent: 'Crinkle food motivation near you',
        zone: 'attract',
        confidence: 'research',
        note: 'Conditioned meal cue with strong face validity.',
        tone: 'treat-bag',
        icon: 'bag',
        contentType: 'bio-approx',
        hzLabel: 'crinkle band',
      },
      {
        id: 'dog-click',
        label: 'Click attention',
        intent: 'Sharp attention getter',
        zone: 'attract',
        confidence: 'mixed',
        note: 'Recall-culture click; best as a trained marker.',
        tone: 'click-tsk',
        icon: 'click',
        contentType: 'synth-tone',
        hzLabel: '~2–4 kHz',
      },
      {
        id: 'dog-puppy',
        label: 'Puppy needs help',
        intent: 'Isolation cry — pull interest to a remote speaker',
        zone: 'lure',
        confidence: 'research',
        note: 'Strongest dog green cue in the papers (~950 Hz F0). Place speaker where you want the dog. Welfare: do not torment.',
        tone: 'puppy-distress',
        icon: 'yelp',
        contentType: 'bio-approx',
        hzLabel: '~950 Hz',
      },
      {
        id: 'dog-squeak',
        label: 'Where’s the squeaky?',
        intent: 'Squeaky-toy play lure toward the speaker',
        zone: 'lure',
        confidence: 'mixed',
        note: 'Strongest dog engagement comment cluster (head-tilt / howl / “where is toy”). Throw/Bluetooth use.',
        tone: 'squeaky-toy',
        icon: 'squeak',
        contentType: 'bio-approx',
        hzLabel: '~2–3 kHz',
      },
      {
        id: 'dog-howl',
        label: 'Pack howl invite',
        intent: 'Contagious vocal — distract toward speaker',
        zone: 'lure',
        confidence: 'experimental',
        note: 'Some dogs join in; others ignore. Fun remote distract option.',
        tone: 'pack-howl',
        icon: 'howl',
        contentType: 'bio-approx',
        hzLabel: '~300–600 Hz',
      },
      {
        id: 'dog-startle',
        label: 'Sudden startle sweep',
        intent: 'Sudden audible interrupt',
        zone: 'deter',
        confidence: 'mixed',
        note: 'Temporary only; welfare caution; habituation likely.',
        tone: 'loud-startle',
        icon: 'burst',
        contentType: 'synth-sweep',
        hzLabel: 'broadband sweep',
      },
      {
        id: 'dog-bark-interrupt',
        label: 'Quiet that bark',
        intent: 'High whistle interrupt try — weak phone evidence',
        zone: 'deter',
        confidence: 'experimental',
        note: 'Not first-line. Address why the dog is barking. Viral “bark stop” loops ≠ reliable silence.',
        tone: 'bark-interrupt',
        icon: 'bark',
        contentType: 'synth-tone',
        hzLabel: '~8–9 kHz',
      },
      {
        id: 'dog-burst',
        label: 'Go-away burst',
        intent: 'Short non-harmful deter pattern',
        zone: 'deter',
        confidence: 'experimental',
        note: 'Best-shot annoyance interrupt — not guaranteed.',
        tone: 'deter-burst',
        icon: 'burst',
        contentType: 'synth-tone',
        hzLabel: '~180–260 Hz',
      },
      {
        id: 'dog-ultra',
        label: 'Silent bark myth',
        intent: 'Claimed ultrasonic bark stop — phones cannot deliver',
        zone: 'deter',
        confidence: 'myth',
        note: 'Classic tests needed extreme SPL ultrasonics. Phones cannot do this. Demo only — not a product promise.',
        tone: 'ultrasonic-try',
        icon: 'wave',
        contentType: 'synth-tone',
        hzLabel: '~9–12 kHz stand-in',
      },
    ],
  },
  {
    id: 'bears',
    name: 'Bears',
    tagline: 'Wildlife on trails',
    framing:
      'Announce yourself. Practice yell / air-horn patterns for education. Never attract or lure. Phone audio is not bear spray.',
    accent: '#8B5A2B',
    attractLabel: 'Attract',
    lureLabel: 'Lure',
    deterLabel: 'Deter / haze',
    emptyAttractMessage:
      'No attract sounds for bears. Skip wounded-animal whistles — they can draw curiosity. Keep wildlife at a distance.',
    emptyLureMessage:
      'No lure sounds for bears. Distress / prey / mating calls can pull curiosity toward the speaker — never place bait audio outdoors.',
    safetyNote:
      'Do not rely on this app for bear safety. Carry recommended deterrents where legal (especially spray), make noise while hiking, store food correctly, and follow local agency guidance. Air horns can fail or provoke. Context matters for defensive encounters.',
    sounds: [
      {
        id: 'bear-trail',
        label: 'Hey bear!',
        intent: 'Announce people — prevent surprise encounters',
        zone: 'deter',
        confidence: 'research',
        note: 'Parks Canada / REI-style trail voice. Comment anecdotes (“dad voice”) align with make-human-noise guidance.',
        tone: 'human-voice-burst',
        icon: 'voice',
        contentType: 'voice-approx',
        hzLabel: '~0.28–0.9 kHz speech energy',
      },
      {
        id: 'bear-yell',
        label: 'Dad voice haze',
        intent: 'Firm yell to discourage approach',
        zone: 'deter',
        confidence: 'research',
        note: 'Viral “dad voice scares bear” pattern + agency hazing guidance when appropriate. Know your species protocol.',
        tone: 'aggressive-yell',
        icon: 'hey',
        contentType: 'voice-approx',
        hzLabel: '~0.36–1.1 kHz speech energy',
      },
      {
        id: 'bear-horn',
        label: 'Air horn blast',
        intent: 'Loud scare pattern (phone-limited SPL)',
        zone: 'deter',
        confidence: 'mixed',
        note: 'News/camper anecdotes of bears leaving — also failures and habituation. Not a spray substitute.',
        tone: 'air-horn',
        icon: 'horn',
        contentType: 'synth-sweep',
        hzLabel: '~410–430 Hz sustain',
      },
      {
        id: 'bear-siren',
        label: 'Warble siren',
        intent: 'Irregular fright pattern',
        zone: 'deter',
        confidence: 'mixed',
        note: 'Vary timing outdoors; sound-only tools habituate.',
        tone: 'warble-siren',
        icon: 'siren',
        contentType: 'synth-sweep',
        hzLabel: '~600–1200 Hz',
      },
      {
        id: 'bear-clang',
        label: 'Camp pot clang',
        intent: 'Hard unnatural noisemaker',
        zone: 'deter',
        confidence: 'mixed',
        note: 'Pot-clang folklore for camp; trail voice still matters more while moving.',
        tone: 'metal-clang',
        icon: 'clang',
        contentType: 'synth-tone',
        hzLabel: '~0.8–1.5 kHz',
      },
    ],
  },
  {
    id: 'mosquitoes',
    name: 'Mosquitoes',
    tagline: 'Science demo, not a repeller',
    framing:
      'We do not claim phone tones repel biting mosquitoes — RCTs and comment failures agree. The wingbeat demo lures males only. Viral “repel” tones stay myth-labeled.',
    accent: '#5C7A1A',
    attractLabel: 'Attract',
    lureLabel: 'Lure (science)',
    deterLabel: 'Myth claims (not product modes)',
    emptyAttractMessage:
      'No general attract board — biting females are not summoned by these phone tones. See Lure for the male phonotaxis science demo.',
    sounds: [
      {
        id: 'moz-wbf',
        label: 'Male wingbeat science',
        intent: 'Female wingbeat ~500 Hz — male phonotaxis toward speaker',
        zone: 'lure',
        confidence: 'research',
        note: 'Valid for male mosquito research — not a consumer control tool, and not a lure for biting females.',
        tone: 'mosquito-wbf',
        icon: 'buzz',
        contentType: 'synth-tone',
        hzLabel: '~526–549 Hz',
      },
      {
        id: 'moz-15k',
        label: 'Viral 15 kHz myth',
        intent: 'Does not repel — teachable viral claim',
        zone: 'deter',
        confidence: 'myth',
        note: 'Cochrane-style reviews + phone/YouTube tests: no bite reduction. Not shipped as “works.”',
        tone: 'mosquito-15k',
        icon: 'wave',
        contentType: 'synth-tone',
        hzLabel: '15 kHz',
      },
      {
        id: 'moz-ultra',
        label: 'Ultrasound doesn’t work',
        intent: 'Phone stand-in for unsupported EMR / silent-repel claims',
        zone: 'deter',
        confidence: 'myth',
        note: 'Blocked as a product promise. Phones can’t deliver real ultrasound bands. Demo only.',
        tone: 'ultrasonic-try',
        icon: 'x',
        contentType: 'synth-tone',
        hzLabel: '~9–12 kHz stand-in',
      },
    ],
  },
  {
    id: 'bees',
    name: 'Bees',
    tagline: 'Education only',
    framing:
      'Honey bee stop signals are nest comb vibrations — not outdoor phone effectors. Freq shows educational tones only. No attract, lure, or repel product modes.',
    accent: '#C49212',
    attractLabel: 'Education',
    lureLabel: 'Lure',
    deterLabel: 'Education',
    educationOnly: true,
    emptyLureMessage:
      'No outdoor lure mode for bees. Nest signals are comb vibrations — not free-field phone attractants.',
    safetyNote:
      'Do not harass nests or hives. Allergy: leave the area and seek care for stings. Plant forage; do not use phones as pest control.',
    sounds: [
      {
        id: 'bee-stop',
        label: 'Stop signal on comb',
        intent: 'Hear ~300–400 Hz vibration band',
        zone: 'edu',
        confidence: 'research',
        note: 'Real A. mellifera biology on comb — not a free-field outdoor deterrent.',
        tone: 'stop-signal-edu',
        icon: 'hive',
        contentType: 'synth-tone',
        hzLabel: '~300–400 Hz',
      },
      {
        id: 'bee-hum',
        label: 'Hive hum sketch',
        intent: 'Educational hive-like drone',
        zone: 'edu',
        confidence: 'experimental',
        note: 'Approximate atmosphere only; phone speakers are not hive substrate.',
        tone: 'hive-hum',
        icon: 'buzz',
        contentType: 'synth-tone',
        hzLabel: '~250–320 Hz',
      },
      {
        id: 'bee-tang',
        label: 'Tanging myth clang',
        intent: 'Historical swarm folklore — not supported',
        zone: 'edu',
        confidence: 'myth',
        note: 'Experimental evidence does not support settling swarms by clanging metal.',
        tone: 'tanging-clang',
        icon: 'clang',
        contentType: 'synth-tone',
        hzLabel: '~0.8–1.5 kHz',
      },
    ],
  },
]

export function getAnimal(id: AnimalId): Animal | undefined {
  return animals.find((animal) => animal.id === id)
}
