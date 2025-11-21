// 1. 使用正确的导入名字 (注意路径是 ../ 因为 douyin.ts 在上一级)
import { getVideoUrl } from "../douyin.ts";

export default async (req: Request) => {
  // 设置 CORS 头，允许小程序访问
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/plain; charset=utf-8",
  };

  // 处理预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const url = new URL(req.url);
  
  // 获取 URL 参数
  if (url.searchParams.has("url")) {
    const inputUrl = url.searchParams.get("url")!;
    
    try {
        // 2. 调用解析函数获取初步链接
        const initialVideoUrl = await getVideoUrl(inputUrl);

        if (!initialVideoUrl) {
            return new Response("Error: Video URL not found", { status: 404, headers });
        }

        // 3. 🔥 关键修改：后端去访问一次，获取重定向后的真实 CDN 地址
        // 这一步能把 iesdouyin.com 变成 v26.douyinvod.com
        const response = await fetch(initialVideoUrl, {
            method: "HEAD", // 只需要头信息
            redirect: "follow", // 自动跟随跳转
            headers: {
                // 伪装成 iPhone
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
            }
        });

        const finalUrl = response.url;

        // 4. 返回最终的长链接
        return new Response(finalUrl, { headers });

    } catch (e: any) {
        return new Response("Server Error: " + e.message, { status: 500, headers });
    }

  } else {
    return new Response("请提供url参数", { status: 400, headers });
  }
};
