import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import skillbridgeLogo from '../assets/skillbridge_logo.png';

const sizeClasses = {
  sm: {
    link: 'h-6',
    image: 'h-12',
    mark: 'h-8 w-8 text-sm',
    text: 'text-lg',
  },
  md: {
    link: 'h-7',
    image: 'h-14',
    mark: 'h-9 w-9 text-base',
    text: 'text-xl',
  },
  lg: {
    link: 'h-8',
    image: 'h-16',
    mark: 'h-10 w-10 text-lg',
    text: 'text-2xl',
  },
};

const Logo = ({ size = 'md', showText = true }) => {
  const { user } = useContext(AuthContext);
  const [imageError, setImageError] = useState(false);
  const classes = sizeClasses[size] || sizeClasses.md;
  const destination = user ? '/dashboard' : '/';

  return (
    <Link
      to={destination}
      aria-label="SkillBridge home"
      className={`inline-flex ${classes.link} shrink-0 items-center`}
    >
      {!showText ? (
        <span
          className={`${classes.mark} inline-flex items-center justify-center rounded-full bg-emerald-700 font-semibold tracking-tight text-white`}
        >
          SB
        </span>
      ) : !imageError ? (
        <img
          src={skillbridgeLogo}
          alt="SkillBridge"
          className={`${classes.image} w-auto max-w-none object-contain`}
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          className={`${classes.text} font-semibold tracking-tight text-emerald-900`}
        >
          SkillBridge
        </span>
      )}
    </Link>
  );
};

export default Logo;
