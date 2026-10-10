import type { WebsiteSettings } from "@/types/domain";

interface Props {
  settings: WebsiteSettings;
}

export function Header({ settings }: Props) {
  return (
    <header className="w-full bg-gradient-to-br from-tmt-cream via-tmt-orange to-tmt-navy py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 relative">
      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-white/30"></div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-5 sm:mb-6 animate-in zoom-in duration-700">
          <img
            src={settings.logoUrl ?? "/images/logo.png"}
            alt={`${settings.siteName} Logo`}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain hover:scale-110 transition-transform duration-300 drop-shadow-lg"
          />
        </div>

        {/* Title with gradient and improved readability */}
        <h1
          className="text-3xl sm:text-5xl lg:text-7xl mb-3 animate-in fade-in slide-in-from-bottom duration-500"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF7D00 0%, #FA9721 50%, #062F3D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
          }}
        >
          {settings.heroHeadline}
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-xl lg:text-2xl text-tmt-navy mb-3 sm:mb-4 font-medium animate-in fade-in slide-in-from-bottom duration-700 delay-150 drop-shadow-sm">
          {settings.tagline}
        </p>

        {/* Subheadline */}
        <p className="text-sm sm:text-base text-tmt-navy/90 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-300 drop-shadow-sm">
          {settings.heroSubheadline}
        </p>
      </div>
    </header>
  );
}
