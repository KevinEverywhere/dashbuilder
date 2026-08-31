export interface TourScene {
  id: string;
  label: string;
  lat: number;
  lng: number;
  heading: string;
  imageUrl: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

/** Wikimedia Commons 360 stills for Destination Atlas cities. Not a 30-city set. */
export const TOUR_SCENES: TourScene[] = [
  {
    id: 'london',
    label: 'Parliament Square, London',
    lat: 51.5006,
    lng: -0.1268,
    heading: 'Westminster',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Parliament_square_360.jpg/1280px-Parliament_square_360.jpg',
    credit: 'Wjh31',
    license: 'Public domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Parliament_square_360.jpg',
  },
  {
    id: 'paris',
    label: 'Eiffel Tower, Paris',
    lat: 48.8584,
    lng: 2.2945,
    heading: '2nd platform',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Paris_360.jpg/1280px-Paris_360.jpg',
    credit: 'Brisbane',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Paris_360.jpg',
  },
  {
    id: 'tokyo',
    label: 'Shinjuku Station, Tokyo',
    lat: 35.6896,
    lng: 139.7006,
    heading: 'South-east gates',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/360_panorama_-_JR_Shinjuku_Station_south_east_ticket_gates_-_Dec_16_2020.jpeg/1280px-360_panorama_-_JR_Shinjuku_Station_south_east_ticket_gates_-_Dec_16_2020.jpeg',
    credit: 'Nesnad',
    license: 'CC BY 4.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:360_panorama_-_JR_Shinjuku_Station_south_east_ticket_gates_-_Dec_16_2020.jpeg',
  },
  {
    id: 'cape-town',
    label: 'Table Mountain, Cape Town',
    lat: -33.9628,
    lng: 18.4098,
    heading: 'Summit',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Table_mountain_2_%E2%80%93_HDR-Panorama_%28Greg_Zaal_and_Rico_Cilliers_via_Poly_Haven%29.jpg/1280px-Table_mountain_2_%E2%80%93_HDR-Panorama_%28Greg_Zaal_and_Rico_Cilliers_via_Poly_Haven%29.jpg',
    credit: 'Greg Zaal & Rico Cilliers / Poly Haven',
    license: 'CC0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Table_mountain_2_%E2%80%93_HDR-Panorama_(Greg_Zaal_and_Rico_Cilliers_via_Poly_Haven).jpg',
  },
];

export function getTourScene(id: string, scenes: TourScene[] = TOUR_SCENES): TourScene | undefined {
  return scenes.find((scene) => scene.id === id);
}
