import { ExternalLink, Mail, Phone } from 'lucide-react';

export const AvailabilityBadge = ({ status = 'available' }) => {
  const badges = {
    available: { label: 'Available', dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    busy: { label: 'Busy', dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    unavailable: { label: 'Not Available', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  };

  const badge = badges[status] || badges.available;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
      <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
};

const socialItems = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'instagram', label: 'Instagram' }
];

const ProfileFreelancerFields = ({ profile }) => {
  const portfolioLinks = Array.isArray(profile?.portfolio_links) ? profile.portfolio_links : [];
  const socialLinks = profile?.social_links && typeof profile.social_links === 'object' ? profile.social_links : {};
  const visibleSocialItems = socialItems.filter((item) => socialLinks[item.key]);

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {(profile?.email || profile?.phone_number) && (
        <div className="grid gap-2">
          {profile?.email && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700">
              <Mail size={15} aria-hidden="true" className="shrink-0 text-emerald-800" />
              <span className="min-w-0 truncate">{profile.email}</span>
            </div>
          )}

          {profile?.phone_number && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700">
              <Phone size={15} aria-hidden="true" className="shrink-0 text-emerald-800" />
              <span className="min-w-0 truncate">{profile.phone_number}</span>
            </div>
          )}
        </div>
      )}

      {portfolioLinks.length > 0 && (
        <div className="space-y-2">
            {portfolioLinks.map((link, index) => (
              <a
                key={`${link.title}-${index}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="min-w-0 truncate font-medium">{link.title}</span>
                <ExternalLink size={15} aria-hidden="true" className="shrink-0" />
              </a>
            ))}
        </div>
      )}

      {visibleSocialItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
            {visibleSocialItems.map(({ key, label }) => (
              <a
                key={key}
                href={socialLinks[key]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ExternalLink size={13} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{label}</span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProfileFreelancerFields;
