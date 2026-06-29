import { ExternalLink, Phone } from 'lucide-react';

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
    <>
      {portfolioLinks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Portfolio</h3>
          <div className="space-y-2">
            {portfolioLinks.map((link, index) => (
              <a
                key={`${link.title}-${index}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="font-medium">{link.title}</span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      )}

      {visibleSocialItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Social Links</h3>
          <div className="flex flex-wrap gap-2">
            {visibleSocialItems.map(({ key, label }) => (
              <a
                key={key}
                href={socialLinks[key]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ExternalLink size={16} aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {profile?.phone_number && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Phone</h3>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <Phone size={16} aria-hidden="true" />
            {profile.phone_number}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileFreelancerFields;
