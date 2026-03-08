// src/data/hemeroteca.ts
//
// type:
//   "youtube" → url = ID del video (ej: "dQw4w9WgXcQ")
//   "drive"   → driveUrl = link de Google Drive (se abre en nueva pestaña)
//   "video"   → url = link directo al archivo de video
//
// category: "reaccion" | "pelicula" | "especial"

export type HemeItem = {
  id: number;
  title: string;
  desc: string;
  category: 'reaccion' | 'pelicula' | 'especial';
  type: 'youtube' | 'drive' | 'video';
  url?: string;      
  emoji?: string;     
  image?: string;     
  driveUrl?: string;  
  date: string;
};

export const hemeroteca: HemeItem[] = [
  {
    id: 1,
    title: 'TEST',
    desc: 'Primera reacción completa',
    category: 'reaccion',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1',
    image : "images/animes/jjk.jpg",
    driveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1',
    date: 'Enero 2025',
  },
  {
    id: 2,
    title: 'Película: TEST',
    desc: 'Reacción + comentarios',
    category: 'pelicula',
    type: 'drive',
    image : "images/animes/jjk.jpg",
    driveUrl: 'https://drive.google.com/file/d/1iwCMdR6nqPPalPTcBkeIiu96I6zMreeK/view',
    date: 'Febrero 2025',
  },
  {
    id: 2,
    title: 'Película: TEST',
    desc: 'Reacción + comentarios',
    category: 'especial',
    type: 'drive',
    image : "images/animes/jjk.jpg",
    driveUrl: 'https://drive.google.com/file/d/1iwCMdR6nqPPalPTcBkeIiu96I6zMreeK/view',
    date: 'Febrero 2025',
  },
];
