/**
 * Consent-gated analytics loader (Stage 5 §17; cookie consent). Scripts are
 * injected only after the user has accepted the "analytics" consent category
 * — never unconditionally. IDs come from Settings (group "analytics").
 */
export function loadAnalytics(ids: { gaId?: string | undefined; gtmId?: string | undefined }): void {
  if (typeof window === 'undefined') return;

  if (ids.gaId) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ids.gaId}`;
    script.async = true;
    document.head.appendChild(script);
    const inline = document.createElement('script');
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ids.gaId}');`;
    document.head.appendChild(inline);
  }

  if (ids.gtmId) {
    const gtm = document.createElement('script');
    gtm.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${ids.gtmId}');`;
    document.head.appendChild(gtm);
  }
}
