# Character Voices (ElevenLabs)

Voice Design prompt + sample text per character. Generate via elevenlabs MCP
(`text_to_voice` / voice design), save the resulting `voice_id` back here.

> **Account is free-tier.** ElevenLabs blocks both custom Voice Design
> (`text_to_voice`, 403 paid-plan) and adding shared-library voices via API.
> Only the 10 default premade voices are usable. Upgrade to Creator ($5/mo) to
> design the real Rioplatense voice, then replace the placeholder below.

## taxista — "Rumor de ciudad"

- **voice_id**: `CwhRBWXzGAHq8TQ4Fs17` — Roger "Laid-Back, Casual, Resonant"
  (premade). **Chosen voice.**
- **target voice_description** _(if ever upgrading to custom design)_: Older Uruguayan
  man, Rioplatense (Montevideo) accent. Gravelly, weathered, slightly hoarse
  from cigarettes. Slow, knowing cadence — speaks like he's passing on a rumor
  at 4am. Calm but faintly unsettling, the voice of someone who appeared rather
  than arrived.
- **render**: `eleven_multilingual_v2`, stability `0.35`
- **sample text**: `Dame un cafe y los cigarros de siempre. No, los otros. Y unos
  chicles. Anota nomas, que ando sin cambio. La noche esta larga, pibe.`
- **sample file**: `public/audio/voices/taxista_sample.mp3`

<!-- ponytail: one voice for now (taxista), free-tier placeholder. On paid plan,
     swap to text_to_voice with target description. Add julia-r, el-yona, radio
     locutor, cursed voice when those are needed. -->
