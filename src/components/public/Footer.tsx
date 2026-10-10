import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import Link from "next/link";
import { BottomSearch } from "./BottomSearch";
import { XIcon } from "./XIcon";
import type { WebsiteSettings } from "@/types/domain";

interface Props {
  settings: WebsiteSettings;
}

/** Builds the social icon list from Settings, skipping any link left blank. */
function buildSocialLinks(settings: WebsiteSettings) {
  const links = [
    { name: "Facebook", href: settings.socialFacebook, icon: Facebook },
    { name: "X", href: settings.socialX, icon: XIcon },
    { name: "Instagram", href: settings.socialInstagram, icon: Instagram },
    { name: "YouTube", href: settings.socialYoutube, icon: Youtube },
  ].filter((link) => link.href.trim().length > 0);

  return [
    ...links,
    { name: "Email", href: `mailto:${settings.contactEmail}`, icon: Mail },
  ];
}

export function Footer({ settings }: Props) {
  const socialLinks = buildSocialLinks(settings);

  return (
    <footer className="bg-tmt-navy text-white mt-16 sm:mt-20 lg:mt-24">
      {/* Bottom Search Bar */}
      <BottomSearch />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 mb-10">
          {/* About Section */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-tmt-orange-light">
              Behind {settings.siteName}
            </h3>
            <p className="text-gray-300 leading-relaxed max-w-md">
              {settings.footerText}
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm">
              <Link href="/about" className="text-gray-300 hover:text-tmt-orange-light transition-colors">
                About Us
              </Link>
              <Link href="/editor-in-chief" className="text-gray-300 hover:text-tmt-orange-light transition-colors">
                Editorial Board
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-tmt-orange-light transition-colors">
                Terms &amp; Conditions
              </Link>
              {/*
                Staff sign-in. Deliberately understated and placed in the
                footer — readers never need it, but editors shouldn't have to
                memorise a URL. This is the only entry point to /login from
                the public site.
              */}
            </div>
          </div>

          {/* Social Media & Quick Links */}
          <div className="flex flex-col items-start md:items-end">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Connect With Us</h3>
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target={name === "Email" ? undefined : "_blank"}
                  rel={name === "Email" ? undefined : "noopener noreferrer"}
                  className="w-10 h-10 rounded-full bg-tmt-orange hover:bg-tmt-orange-light flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label={name}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            <div className="text-sm text-gray-400 text-left md:text-right">
              <p>Marinduque State University</p>
              <p>College of Engineering</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
          <Link href="/terms" className="hover:text-tmt-orange-light transition-colors">
            Terms and Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
