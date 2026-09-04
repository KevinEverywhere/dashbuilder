# Authoring 360 clips — credits

Short silent MP4s for Destination Atlas Authoring. Each file is an
8-second encode of a Wikimedia Commons still that is already ~2:1
equirectangular (or padded to 2048×1024).

**Shipped in git:** `media/authoring-360/*.mp4` (~14 MB total). After
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
| Bangkok | Chao Mae Tuptim | Ddalbiez | CC BY-SA 3.0 |
| Singapore | Marina Bay | Omar David Sandoval Sida | CC BY-SA 4.0 |
| Seoul | Jongno (Mapillary) | lisbethw1130 | CC BY-SA 4.0 |
| Mumbai | Gateway of India | Fuzheado | CC BY-SA 4.0 |
| Paris | Notre-Dame / Île de la Cité | DXR | CC BY-SA 3.0 |
| London | Isabella Plantation | Diliff | CC BY-SA 3.0 |
| Rome | Colosseum | Commons contributors | CC BY-SA 4.0 |
| Berlin | Potsdamer Platz | Ansgar Koreng | CC BY-SA 4.0 |
| Marrakech | Medina (Mapillary) | navcities | CC BY-SA 4.0 |
| Cairo | Greater Cairo (Mapillary) | Twospatial | CC BY-SA 4.0 |
| Cape Town | Simon's Town penguins | Discott | CC BY-SA 4.0 |
| Lagos | Lagos Island (Mapillary) | moriwo | CC BY-SA 4.0 |
| New York | Times Square (Mapillary) | CartographDots | CC BY-SA 4.0 |
| Mexico City | Palacio de Bellas Artes | Uwebart | CC BY-SA 3.0 |
| Toronto | Downtown | Kiffer Creveling | CC BY-SA 4.0 |
| Los Angeles | San Pedro fireboat | Matthew Dillon | CC BY 2.0 |
| Vancouver | False Creek | Joe Mabel | CC BY-SA 3.0 |
| Cusco | Plaza de Armas | Johnattan Rupire | CC BY-SA 4.0 |
| Buenos Aires | Scalabrini Ortiz | Commons contributors | CC BY-SA 4.0 |
| Bogotá | Monserrate | AmiGueko | CC BY-SA 3.0 |
| Santiago | ESO office | ESO | CC BY 4.0 |
| Sydney | City panorama | Tibor Kovacs | CC BY 2.0 |
| Auckland | Ponsonby (Mapillary) | ralley | CC BY-SA 4.0 |
| Queenstown | Lower Shotover Bridge | Bernard Spragg. NZ | CC0 |
| Honolulu | Mānoa Heritage Center | Fuzheado | CC0 |

File pages: see `commonsTitle` in
`src/data/authoring-360-sources.json`.

## Not found as 2:1 equirect on Commons

Barcelona, Nairobi, Rio de Janeiro, Melbourne. Authoring stays
upload-your-own for those four. Cylindrical 360 skyline stills
exist but would letterbox into a thin equatorial band on the
sphere.

True free VR *video* of these thirty cities is not available as
a redistributable set (YouTube 360 cannot be downloaded and
shipped). Stills-to-clip is the licensed path.
