// Aplica colores, título, y favicon a nivel global
export function applyBrandingTheme(branding) {
  if (!branding) return;

  // Colores (Tailwind puede leerlos como CSS vars si los mapeas)
  if (branding?.primary_color)  document.documentElement?.style?.setProperty('--brand-primary',  branding?.primary_color);
  if (branding?.secondary_color)document.documentElement?.style?.setProperty('--brand-secondary',branding?.secondary_color);

  // Título
  if (branding?.brand_name) document.title = branding?.brand_name;

  // Favicon
  if (branding?.favicon_url) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head?.appendChild(link);
    }
    link.href = branding?.favicon_url;
  }
}