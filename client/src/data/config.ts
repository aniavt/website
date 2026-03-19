// src/data/config.ts
// ✏️  EDITAR ESTE ARCHIVO para la configuración general del sitio


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
