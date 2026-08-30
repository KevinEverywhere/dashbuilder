export interface TourScene {
  id: string;
  label: string;
  lat: number;
  lng: number;
  heading: string;
  imageUrl: string;
}

export const TOUR_SCENES: TourScene[] = [
  {
    id: 'london',
    label: 'British Museum, London',
    lat: 51.5194,
    lng: -0.1269,
    heading: 'Great Court',
    imageUrl: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/cubes.jpg',
  },
  {
    id: 'venice',
    label: 'Piazza San Marco, Venice',
    lat: 45.4341,
    lng: 12.3388,
    heading: 'Basilica',
    imageUrl: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg',
  },
  {
    id: 'sancy',
    label: 'Puy de Sancy, France',
    lat: 45.5286,
    lng: 2.8142,
    heading: 'Summit',
    imageUrl: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/puydesancy.jpg',
  },
  {
    id: 'sechelt',
    label: 'Sechelt Inlet, Canada',
    lat: 49.4744,
    lng: -123.7547,
    heading: 'Inlet',
    imageUrl: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg',
  },
];

export function getTourScene(id: string, scenes: TourScene[] = TOUR_SCENES): TourScene | undefined {
  return scenes.find((scene) => scene.id === id);
}
