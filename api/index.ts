let app: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      const serverModule = await import("../server.js");
      app = serverModule.default;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Handler Error:", err);
    res.status(500).json({
      error: "Server initialization error",
      message: err.message,
      stack: err.stack,
    });
  }
}
