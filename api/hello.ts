import { douyin } from "../douyin.ts";

export default async (req: Request) => {
  // 1. 获取 URL 参数
  const url = new URL(req.url).searchParams.get("url");

  // 2. 跨域头设置 (允许小程序访问)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/plain; charset=utf-8",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!url) {
    return new Response("Error: URL is required", { status: 400, headers });
  }

  try {
    // 3. 调用 douyin.ts 获取初步数据
    const result = await douyin(url);
    
    // 从结果中提取初步的视频链接 (通常是 iesdouyin.com 开头)
    // 根据你的 douyin.ts 返回格式，通常在 nwm_video_url 或 video_url 里
    let initialUrl = "";
    if (typeof result === 'string') {
        initialUrl = result;
    } else if (result.nwm_video_url) {
        initialUrl = result.nwm_video_url;
    } else if (result.video_url) {
        initialUrl = result.video_url;
    } else if (result.url) {
        initialUrl = result.url;
    }

    if (!initialUrl) {
        return new Response("Error: Video URL not found", { status: 404, headers });
    }

    // 4. 🔥 核心步骤：后端去访问一次，获取重定向后的真实 CDN 地址
    // 这一步能绕过微信的防盗链拦截
    const response = await fetch(initialUrl, {
        method: "HEAD", // 只需要头信息
        redirect: "follow", // 自动跟随跳转
        headers: {
            // 伪装成 iPhone 浏览器
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        }
    });

    const finalUrl = response.url; // 拿到 v26.douyinvod.com...

    // 5. 返回最终地址
    return new Response(finalUrl, { status: 200, headers });

  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500, headers });
  }
};
