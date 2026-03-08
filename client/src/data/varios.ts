// src/data/varios.ts
// ✏️  EDITAR ESTE ARCHIVO para actualizar los animes varios (fuera de temporada)

export type VariosItem = {
  title: string;
  genre: string;
  emoji?: string;
  image?: string;
  status: 'completed' | 'upcoming';
  url: string;    // link a animeav1.com, TMO, etc.
  urlLabel: string; // "Ver en AV1" | "Leer en TMO"
  id? : number
  description? : string
  episodes: VariosEpisode[];
};

export type VariosEpisode = {
  num: string;
  label: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  date?: string;
  isNew?: boolean;
};

export type VariosSection = {
  section: string;
  items: VariosItem[];
};

export const varios: VariosSection[] = [
  {
    section: 'Reacciones Pasadas',
    items: [
      {
        title: 'TEST',
        genre: 'Acción / Drama',
        image : "/images/animes/frieren-s2.jpg",
        status: 'completed',
        url: 'https://animeav1.com/',
        urlLabel: 'Ver en AV1',
        episodes: [
          { num: 'EP 01', label: 'TEST', url: 'https://animeav1.com/' },
          { num: 'EP 02', label: 'TEST', url: 'https://animeav1.com/' },
          { num: 'EP 03', label: 'TEST', url: 'https://animeav1.com/' },
        ],
        id : 1
      },
    ],
  },
  {
    section: 'En Lista de Espera',
    items: [
      {
        title: 'TEST',
        genre: 'Histórico / Drama',
        image : "/images/animes/frieren-s2.jpg",
        status: 'upcoming',
        url: 'https://animeav1.com/',
        urlLabel: 'Ver en AV1',
        episodes: [
          { num: 'EP 01', label: 'TEST', url: 'https://animeav1.com/' },
        ],
      },
    ],
  },
];
