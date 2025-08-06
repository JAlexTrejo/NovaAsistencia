import React from 'react';
import { useBranding } from '../BrandingProvider';

const BrandedFooter = ({ className = '' }) => {
  const { getFooterText, getCopyrightText, brandingSettings, loading } = useBranding();

  if (loading) {
    return (
      <footer className={`bg-card border-t border-border py-4 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <div className="w-48 h-4 bg-muted animate-pulse rounded mx-auto"></div>
            <div className="w-64 h-4 bg-muted animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </footer>
    );
  }

  const footerText = getFooterText();
  const copyrightText = getCopyrightText();
  const supportEmail = brandingSettings?.support_email;
  const companyWebsite = brandingSettings?.company_website;
  const privacyPolicyUrl = brandingSettings?.privacy_policy_url;
  const termsOfServiceUrl = brandingSettings?.terms_of_service_url;

  return (
    <footer className={`bg-card border-t border-border py-6 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center space-y-3">
          {/* Footer Text */}
          <p className="text-sm text-muted-foreground">
            {footerText}
          </p>

          {/* Links */}
          {(supportEmail || companyWebsite || privacyPolicyUrl || termsOfServiceUrl) && (
            <div className="flex flex-wrap justify-center items-center space-x-4 text-xs text-muted-foreground">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="hover:text-primary transition-colors"
                >
                  Soporte
                </a>
              )}
              {companyWebsite && (
                <a
                  href={companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Sitio Web
                </a>
              )}
              {privacyPolicyUrl && (
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Privacidad
                </a>
              )}
              {termsOfServiceUrl && (
                <a
                  href={termsOfServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Términos
                </a>
              )}
            </div>
          )}

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BrandedFooter;