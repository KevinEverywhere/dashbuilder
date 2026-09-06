# Authoring 360 clips — credits

Short silent MP4s for Destination Atlas Authoring. Each file is an
8-second encode of a Wikimedia Commons still that is already ~2:1
equirectangular (or padded to 2048×1024).

**Shipped in git:** `media/authoring-360/*.mp4` (~15 MB total). After
`npm install`, `authoring:link-360` symlinks them into proof apps and
`demo:tour`.

Rebuild from Commons (optional; needs ffmpeg + network):

```
npm run authoring:fetch-360
```

Media (YouTube) stays separate. These clips do not change
`videoProjection` and do not steal the watch tab.

## Sources

| City | Still | Credit | License |
|------|-------|--------|---------|
| Tokyo | Roppongi Hills | nesnad | CC BY-SA 3.0 |
| Bangkok | Bangkok skyline | srihariyv | CC BY-SA 4.0 |
| Singapore | Marina Bay | Omar David Sandoval Sida | CC BY-SA 4.0 |
| Seoul | Jongno (Mapillary) | lisbethw1130 | CC BY-SA 4.0 |
| Mumbai | Gateway of India | Fuzheado | CC BY-SA 4.0 |
| Paris | Notre-Dame / Île de la Cité | DXR | CC BY-SA 3.0 |
| London | Isabella Plantation | Diliff | CC BY-SA 3.0 |
| Rome | Rome from Villa Borghese | Greg Zaal / Rico Cilliers | CC0 |
| Barcelona | Barcelona cityscape | Bengt Nyman | CC BY 2.0 |
| Berlin | Potsdamer Platz | Ansgar Koreng | CC BY-SA 4.0 |
| Marrakech | Medina (Mapillary) | navcities | CC BY-SA 4.0 |
| Cairo | Greater Cairo (Mapillary) | Twospatial | CC BY-SA 4.0 |
| Cape Town | Simon's Town penguins | Discott | CC BY-SA 4.0 |
| Lagos | Lagos Island (Mapillary) | moriwo | CC BY-SA 4.0 |
| New York | Times Square (Mapillary) | CartographDots | CC BY-SA 4.0 |
| Mexico City | Xochimilco drone 360° | ProtoplasmaKid | CC BY 4.0 |
| Toronto | Downtown Toronto 360° | Peter Leth | CC BY 2.0 |
| Los Angeles | Downtown LA street (Mapillary) | uwrapid / Mapillary | CC BY-SA 4.0 |
| Vancouver | Downtown skyline from Spanish Banks | Dllu | CC BY-SA 4.0 |
| Cusco | Plaza de Armas | Johnattan Rupire | CC BY-SA 4.0 |
| Rio de Janeiro | South Zone from Morro Dois Irmãos | Wilfredor | CC0 |
| Buenos Aires | Scalabrini Ortiz | Commons contributors | CC BY-SA 4.0 |
| Bogotá | Monserrate | AmiGueko | CC BY-SA 3.0 |
| Santiago | ESO office | ESO | CC BY 4.0 |
| Sydney | City panorama | Tibor Kovacs | CC BY 2.0 |
| Melbourne | CBD skyline from St Kilda Pier | Dietmar Rabich | CC BY-SA 4.0 |
| Auckland | Ponsonby (Mapillary) | ralley | CC BY-SA 4.0 |
| Queenstown | Queenstown from Skyline Gondola (cylindrical→equirect) | William Stewart | CC BY-SA 3.0 |
| Honolulu | Mānoa Heritage Center | Fuzheado | CC0 |

File pages: see `commonsTitle` in
`src/data/authoring-360-sources.json`.

## Notes on source quality (DAS-183)

Eleven cities were upgraded to native ~2:1 equirect stills where
Commons had cityscape or elevated views (Barcelona, Bangkok, Rome,
Toronto, Mexico City, Melbourne, Vancouver, Rio). Queenstown uses a
cylindrical gondola pan reprojected with ffmpeg `v360`.

**Nairobi** has no usable CC equirect (or cylindrical) cityscape on
Commons — the shipped clip was removed; Authoring shows the missing-
content message until a proper source appears.

Los Angeles has no redistributable 2:1 skyline pan on Commons; the
clip uses Mapillary street-level 360 until a better CC source appears.

Re-run for one city: `node scripts/fetch-authoring-360.mjs --only rio`

## Licensing reminder

True free VR *video* of these thirty cities is not available as a
redistributable set (YouTube 360 cannot be downloaded and shipped).
Stills-to-clip is the licensed path.
