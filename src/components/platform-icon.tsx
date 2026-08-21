import { Instagram, Music, Youtube, Facebook, Send, Twitter, Twitch, Ghost, Linkedin, Pin, MessageSquare } from 'lucide-react';

type PlatformName = 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook' | 'Telegram' | 'X' | 'Twitter' | 'Twitch' | 'Snapchat' | 'Threads' | 'Pinterest' | 'Reddit' | 'LinkedIn' | 'Spotify' | 'Discord' | 'SoundCloud' | 'Clubhouse' | string;

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E4405F',
  TikTok: '#000000',
  YouTube: '#FF0000',
  Facebook: '#1877F2',
  Telegram: '#26A5E4',
  X: '#000000',
  Twitter: '#1DA1F2',
  Twitch: '#9146FF',
  Snapchat: '#FFFC00',
  Threads: '#000000',
  Pinterest: '#E60023',
  Reddit: '#FF4500',
  LinkedIn: '#0A66C2',
  Spotify: '#1DB954',
  Discord: '#5865F2',
  SoundCloud: '#FF5500',
  Clubhouse: '#000000',
};

function TikTokSvg({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.84V6.69h3.77z" />
    </svg>
  );
}

function ThreadsSvg({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.063 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.798-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.826-1.063-.717-1.697-1.805-1.788-3.164-.176-2.564 1.99-4.94 4.893-5.574 1.09-.231 2.137-.22 3.056.035-.087-.536-.26-1.022-.517-1.452-.517-.863-1.356-1.404-2.496-1.61l.37-2.024c1.648.301 2.923 1.104 3.79 2.39.573.85.942 1.856 1.098 2.996.675.461 1.237 1.033 1.648 1.708.926 1.527 1.013 3.498.236 5.342-.674 1.586-1.894 2.882-3.628 3.854-1.608.9-3.506 1.36-5.744 1.373zm-.67-9.728c-2.008.433-3.554 2.092-3.438 3.774.048.7.39 1.245.964 1.63.543.37 1.256.53 2.008.49 1.024-.054 1.822-.423 2.376-1.098.51-.62.837-1.506.974-2.638a8.826 8.826 0 00-2.884-2.158z" />
    </svg>
  );
}

function SnapchatSvg({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.158.516.179.885.39 1.429.658.364.18.636.347.848.476.735.442.91.826.91 1.143 0 .42-.312.698-.863.873-.194.061-.422.103-.696.127-.068.006-.14.012-.21.016a.917.917 0 00-.09.004c-.15.018-.268.058-.36.126-.074.056-.132.128-.2.233-.063.098-.13.21-.208.339-.258.423-.523.742-.942.994a.093.093 0 01-.068.018c-.128 0-.295-.07-.5-.215a3.47 3.47 0 00-.27-.166c-.035-.02-.07-.037-.106-.055-.175-.09-.393-.182-.646-.273-.518-.188-1.107-.309-1.751-.36-.2-.015-.396-.023-.584-.023-.193 0-.386.008-.584.023-.644.05-1.233.172-1.75.36a5.438 5.438 0 00-.647.273c-.037.018-.071.035-.107.055-.092.05-.188.104-.269.166-.206.145-.373.215-.501.215a.093.093 0 01-.068-.018c-.42-.252-.684-.571-.942-.994a2.594 2.594 0 00-.208-.339 1.016 1.016 0 00-.2-.233.748.748 0 00-.36-.126 1.644 1.644 0 00-.09-.004 4.983 4.983 0 01-.21-.016c-.274-.024-.502-.066-.696-.127-.551-.175-.863-.453-.863-.873 0-.317.175-.701.91-1.143.212-.129.484-.296.848-.476.544-.268.91-.479 1.429-.658.198-.068.326-.113.401-.158-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.86 1.07 11.216.793 12.206.793z" />
    </svg>
  );
}

function RedditSvg({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0A12 12 0 1 0 0 12a12 12 0 0 0 12 0zM9.417 15.644a.75.75 0 0 0-1.059-.064c-.35.312-.55.76-.55 1.22 0 .93.756 1.688 1.688 1.688.93 0 1.687-.757 1.687-1.688a.75.75 0 0 0-1.5 0 .187.187 0 0 1-.187.188.188.188 0 0 1-.188-.188c0-.16.063-.31.175-.418a.75.75 0 0 0-.066-1.038zm6.955.832a.75.75 0 0 0-1.047.15c-.177.266-.45.418-.743.418a.75.75 0 0 0 0 1.5c.685 0 1.316-.352 1.678-.922a.75.75 0 0 0-.888-1.146zM20.25 12a.75.75 0 0 0-.75.75c0 2.938-2.012 5.423-4.735 6.137a.75.75 0 0 0 .374 1.454c3.22-.833 5.611-3.765 5.611-7.09a.75.75 0 0 0-.75-.75zm-8.25 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
    </svg>
  );
}

function PinterestSvg({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
  );
}

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function PlatformIcon({ platform, size = 18, className = '', showLabel = false }: PlatformIconProps) {
  const color = PLATFORM_COLORS[platform] || '#64748b';
  const bgOpacity = 0.1;
  const bgColor = color + '1a'; // hex with alpha

  const renderIcon = () => {
    switch (platform) {
      case 'Instagram':
        return <Instagram style={{ color, width: size, height: size }} />;
      case 'TikTok':
        return <TikTokSvg size={size} className={className} />;
      case 'YouTube':
        return <Youtube style={{ color, width: size, height: size }} />;
      case 'Facebook':
        return <Facebook style={{ color, width: size, height: size }} />;
      case 'Telegram':
        return <Send style={{ color, width: size, height: size }} />;
      case 'X':
      case 'Twitter':
        return <Twitter style={{ color, width: size, height: size }} />;
      case 'Twitch':
        return <Twitch style={{ color, width: size, height: size }} />;
      case 'Snapchat':
        return <SnapchatSvg size={size} className={className} />;
      case 'Threads':
        return <ThreadsSvg size={size} className={className} />;
      case 'Pinterest':
        return <PinterestSvg size={size} className={className} />;
      case 'Reddit':
        return <RedditSvg size={size} className={className} />;
      case 'LinkedIn':
        return <Linkedin style={{ color, width: size, height: size }} />;
      default:
        return (
          <span style={{ color, fontSize: size * 0.8, fontWeight: 700, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {platform.charAt(0).toUpperCase()}
          </span>
        );
    }
  };

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span style={{ backgroundColor: bgColor, borderRadius: '6px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderIcon()}
        </span>
        <span className="text-sm text-slate-700 font-medium">{platform}</span>
      </span>
    );
  }

  return (
    <span style={{ backgroundColor: bgColor, borderRadius: '6px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }} className={className}>
      {renderIcon()}
    </span>
  );
}

export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] || '#64748b';
}
