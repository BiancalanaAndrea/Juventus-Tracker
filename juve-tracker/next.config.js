/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Le foto dei giocatori sono URL inseriti manualmente dall'utente,
    // quindi il dominio non è prevedibile in anticipo: disattiviamo
    // l'ottimizzazione automatica delle immagini di Next.js per queste.
    unoptimized: true,
  },
};

module.exports = nextConfig;
