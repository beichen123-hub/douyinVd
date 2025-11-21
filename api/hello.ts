import { getVideoUrl } from "../douyin.ts";

export default async (req: Request) => {
  // 1. 设置 CORS 头，允许小程序访问
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/plain; charset=utf-8",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // 2. 获取 URL 参数
    const url = new URL(req.url);
    const inputUrl = url.searchParams.get("url");

    if (!inputUrl) {
      return new Response("Error: Missing 'url' parameter", { status: 400, headers });
    }

    // 3. 调用解析函数
    const initialVideoUrl = await getVideoUrl(inputUrl);

    if (!initialVideoUrl) {
      return new Response("Error: Video URL not found", { status: 404, headers });
    }

    // 4. 🔥【核心修改】🔥
    // 这一步非常关键！后端伪装成 iPhone 去获取重定向后的真实 CDN 地址
    // 这样返回给小程序的直接就是视频源文件，不会被微信拦截
    const response = await fetch(initialVideoUrl, {
        method: "HEAD", // 只需要头信息
        redirect: "follow", // 自动跟随跳转
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        }
    });

    const finalUrl = response.url;

    // 5. 返回最终的长链接
    return new Response(finalUrl, { status: 200, headers });

  } catch (e: any) {
    return new Response(`Server Error: ${e.message}`, { status: 500, headers });
  }
};
