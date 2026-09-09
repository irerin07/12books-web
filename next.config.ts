import type { NextConfig } from "next";

/**
 * API는 Next를 거쳐 백엔드로 넘긴다.
 *
 * 브라우저 입장에서는 모든 요청이 이 앱과 같은 오리진(:3000)으로 나가므로 CORS 설정이
 * 필요 없다. 무엇보다 로그인 때 내려오는 refresh 쿠키가 SameSite=Strict에
 * Path=/api/v1/auth라, 다른 오리진에서 부르면 재발급과 로그아웃이 아예 동작하지 않는다.
 * 프록시로 두면 그 경로가 그대로 유지된다.
 */
const backend = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "search1.kakaocdn.net" },
      { protocol: "https", hostname: "search2.kakaocdn.net" },
      { protocol: "https", hostname: "search3.kakaocdn.net" },
      { protocol: "https", hostname: "search4.kakaocdn.net" },
      { protocol: "http", hostname: "t1.daumcdn.net" },
    ],
  },
};

export default nextConfig;
