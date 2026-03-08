// src/data/config.ts
// ✏️  EDITAR ESTE ARCHIVO para la configuración general del sitio

// ── Preguntas frecuentes ──────────────────────────────
export const faq = [
  {
    q: '¿Cuándo son los streams de Ania?',
    a: 'Los streams son Lunes (Noche de Momazos), Martes (Reacciones & Animes) y Miércoles (Clips del Mes). Revisa el Calendario para los horarios exactos por país.',
  },
  {
    q: '¿Dónde puedo ver las reacciones guardadas?',
    a: 'Todas las reacciones archivadas están en la sección Hemeroteca. Cada tarjeta abre el video correspondiente o redirige al Drive.',
  },
  {
    q: '¿Qué es el apartado de Manga?',
    a: 'Es un proyecto de Xtremo + Ania donde podrás leer manga con OSTs configurables por capítulo. Está en desarrollo, ¡pronto disponible!',
  },
  {
    q: '¿Cómo puedo sugerir un anime para ver?',
    a: 'Déjanos un comentario en la sección FAQ & Staff o escríbenos en el Discord de la comunidad. ¡Leemos todo!',
  },
  {
    q: '¿Quiénes manejan la página?',
    a: 'La página es gestionada por el staff de Ania Starlight (Xtremo + Ania). Si ves algo roto o quieres sugerir algo, ¡avísanos!',
  },
  {
    q: '¿La Hemeroteca tendrá contraseña?',
    a: 'Sí, en el futuro algunas secciones de la Hemeroteca tendrán acceso exclusivo para la comunidad. Por ahora todo es libre.',
  },
];

// ── Horario de streams ────────────────────────────────
export type StreamDay = {
  day: string;       // "LUN 02"
  title: string;
  desc: string;
  times: { cc: string; time: string }[];
};

export const streams: StreamDay[] = [
  {
    day: 'LUN 02',
    title: 'Noche de Momazos & Intro Semanal',
    desc: 'Noche de ver momazos en Discord por cofres de Streamloots',
    times: [
      { cc: 'PE', time: '18:30' },
      { cc: 'MX', time: '17:30' },
      { cc: 'AR', time: '20:30' },
      { cc: 'ES', time: '00:30' },
    ],
  },
  {
    day: 'MAR 03',
    title: 'Reacciones? & Animes Semanales',
    desc: 'Jujutsu Kaisen, Darwin Incident, Fire Force, S. To Be a Hero & Frieren',
    times: [
      { cc: 'PE', time: '18:30' },
      { cc: 'MX', time: '17:30' },
      { cc: 'AR', time: '20:30' },
      { cc: 'ES', time: '00:30' },
    ],
  },
  {
    day: 'MIE 04',
    title: 'Clips del Mes & Pre-Arco de Brasil',
    desc: 'Jujutsu Kaisen, Darwin Incident, Fire Force, S. To Be a Hero & Frieren',
    times: [
      { cc: 'PE', time: '18:30' },
      { cc: 'MX', time: '17:30' },
      { cc: 'AR', time: '20:30' },
      { cc: 'ES', time: '00:30' },
    ],
  },
];

// ── Redes sociales ────────────────────────────────────
export const socials = {
  twitter:    'https://twitter.com/aniastarlight',
  twitch:     'https://twitch.tv/aniastarlight',
  youtube:    'https://youtube.com/@AniaStarLightVT',
  instagram:  'https://instagram.com/aniastarlightvt',
  tiktok:     'https://tiktok.com/@aniastarlightvt',
  discord:    'https://discord.gg/INVITE',
  throne :    'https://throne.com/aniastarlight',
  streamlabs: 'https://streamlabs.com/aniastarlight/tip'
};
