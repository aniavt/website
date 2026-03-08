// src/data/animes.ts
// ✏️  EDITAR ESTE ARCHIVO para actualizar los animes de temporada
// status: "watching" | "completed" | "upcoming"

export type Episode = {
  num: string;    // "EP 01"
  label: string;  // "Capítulo 1 - Título opcional"
  url: string;    // link a animeav1.com o similar
};

export type Anime = {
  id: number;
  title: string;
  genre: string;
  status: 'watching' | 'completed' | 'upcoming';
  emoji?: string;   
  image?: string;    
  coverImage?: string;  
  description?: string;
  episodes: Episode[];
};

export const animes: Anime[] = [
  {
    id: 1,
    title: 'Jujutsu Kaisen',
    genre: 'Acción / Sobrenatural',
    status: 'watching',
    image: '/images/animes/jjk.jpg',
    coverImage : '/images/animes/jjk.jpg',
    description : 'BODRIO KAISEN',
    episodes: [
      { num: 'EP 01', label: 'Capítulo 1', url: 'https://animeav1.com/' },
      { num: 'EP 02', label: 'Capítulo 2', url: 'https://animeav1.com/' },
      { num: 'EP 03', label: 'Capítulo 3', url: 'https://animeav1.com/' },
    ],
  },
  {
    id: 2,
    title: "Darwin Incident",
    genre: 'Acción / Supervivencia',
    status: 'watching',
    image: '/images/animes/darwin-incident.jpg',
    coverImage : '/images/animes/darwin-incident.jpg',
    description : 'ANIME MEXICANO',
    episodes: [
      { num: 'EP 01', label: 'Capítulo 1', url: 'https://drive.google.com/file/d/1ttH4EQ9jdeB0VqbL6AFG9h10G0RXrdTg/view' },
      { num: 'EP 02', label: 'Capítulo 2', url: 'https://drive.google.com/file/d/1NE4Urn-TbthMhqTLxJnihXs5kcz7vNLP/view' },
      { num: 'EP 03', label: 'Capítulo 3', url: 'https://drive.google.com/file/d/1JXrrvy-2rSf6ksAinNqnmYzyBicACxia/view' },
      { num: 'EP 04', label: 'Capítulo 4', url: 'https://drive.google.com/file/d/15WAOdU84cSHXoHh_vPnPMj5hV8J1hsLd/view' },
      { num: 'EP 05', label: 'Capítulo 5', url: 'https://drive.google.com/file/d/1qIds5Zy75Y0mLOHuKVgYhX4qis4daKQK/view' },
      { num: 'EP 06', label: 'Capítulo 6', url: 'https://drive.google.com/file/d/1-jLJ9UldL4qH63qb-fNKUJF9lI8yGEBx/view' },
      { num: 'EP 07', label: 'Capítulo 7', url: 'https://drive.google.com/file/d/1KNN5_n56Xvbj7DvDBF4eQLusL_Puq38L/view' },
      { num: 'EP 08', label: 'Capítulo 8', url: 'https://drive.google.com/file/d/1R-e5sZniRxZbUoa0_eHDSGMlCuS-FX6O/view' },
      { num: 'EP 09', label: 'Capítulo 9', url: 'https://drive.google.com/file/d/1qY2uyiAW0Z0f-as_s8LUqmzW1uOr-ZHY/view' },
    ],
  },
  {
    id: 3,
    title: 'Fire Force',
    genre: 'Acción / Fantasía',
    status: 'watching',
    image: '/images/animes/fireforce-s3.png',
    coverImage : '/images/animes/fireforce-s3.png',
    description : 'TOMA TAMAKI TOMA',
    episodes: [
      { num: 'EP 01', label: 'Capítulo 1', url: 'https://animeav1.com/' },
      { num: 'EP 02', label: 'Capítulo 2', url: 'https://animeav1.com/' },
    ],
  },
  {
    id: 4,
    title: 'Frieren',
    genre: 'Fantasy / Slice of Life',
    status: 'watching',
    image: '/images/animes/frieren-s2.jpg',
    coverImage : '/images/animes/frieren-s2.jpg',
    description : 'El viejo Jenkins',
    episodes: [
      { num: 'EP 01', label: 'Capítulo 1', url: 'https://animeav1.com/' },
      { num: 'EP 02', label: 'Capítulo 2', url: 'https://animeav1.com/' },
    ],
  },
  {
    id: 5,
    title: 'Sentenced To Be a Hero',
    genre: 'Aventura',
    status: 'watching',
    image: '/images/animes/stobeahero.jpg',
    coverImage : '/images/animes/stobeahero.jpg',
    description : 'Al chile no c',
    episodes: [
      { num: 'EP 01', label: 'Capítulo 1', url: 'https://animeav1.com/' },
    ],
  },
  {
    id: 6,
    title: 'Próximo Anime',
    genre: 'Por confirmar',
    status: 'upcoming',
    emoji: '❓',
    episodes: [],
  },
];
