import type {NextConfig} from 'next';

// 필리핀 표준시(UTC+8)로 현재 시간을 포맷하는 함수
const getBuildVersion = () => {
  const now = new Date();
  const offset = 8 * 60; // Philippines Time is UTC+8
  const phTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);

  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}`;
}


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https'
        ,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
  }
};

// Re-trigger build to resolve security warning
export default nextConfig;
