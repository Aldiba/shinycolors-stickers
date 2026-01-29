import React from "react";

interface InfoProps {
  open: boolean;
  handleClose: () => void;
  config: any; 
  t: (key: string) => string;
}

export default function Info({ open, handleClose, config, t }: InfoProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 (点击关闭) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* 模态框主体 */}
      <div className="relative w-full max-w-md bg-base-100 rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-base-200">
        
        {/* 标题栏 */}
        <div className="bg-base-200/50 p-4 border-b border-base-200 flex justify-between items-center">
          <h3 className="font-bold text-lg">{t("about_title")}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* 贡献者列表 */}
          <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">
            {t("credits_title")}
          </h4>
          <ul className="flex flex-col gap-2">
            <li>
              <a 
                href="https://github.com/TheOriginalAyaka" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200 transition-colors border border-base-200 hover:border-secondary/50 group"
              >
                <div className="avatar">
                  <div className="w-12 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2 group-hover:ring-secondary transition-all">
                    <img src="https://avatars.githubusercontent.com/TheOriginalAyaka" alt="TheOriginalAyaka" />
                  </div>
                </div>
                <div>
                  <div className="font-bold group-hover:text-secondary transition-colors">TheOriginalAyaka</div>
                  <div className="text-xs opacity-70">Creator of pjsk stickers</div>
                </div>
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/Aldiba" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200 transition-colors border border-base-200 hover:border-secondary/50 group"
              >
                <div className="avatar">
                  <div className="w-12 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2 group-hover:ring-secondary transition-all">
                    <img src="https://avatars.githubusercontent.com/Aldiba" alt="Aldiba" />
                  </div>
                </div>
                <div>
                  <div className="font-bold group-hover:text-secondary transition-colors">Aldiba</div>
                  <div className="text-xs opacity-70">外星生物</div>
                </div>
              </a>
            </li>
          </ul>

          {/* 源代码链接 */}
          <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mt-6 mb-3">
            {t("source_code_title")}
          </h4>
          <a 
            href="https://github.com/Aldiba/shinycolors-stickers" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200 transition-colors border border-base-200 hover:border-secondary/50 group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
              {/* GitHub SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </div>
            <div>
              <div className="font-bold group-hover:text-secondary transition-colors">GitHub</div>
              <div className="text-xs opacity-70">Star this repository!</div>
            </div>
          </a>

          {/* 统计数据
          <div className="mt-8 text-center bg-base-200/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase">{t("total_stickers_made")}</h4>
            <p className="text-3xl font-black text-secondary font-yuruka mt-1">
              {config?.global
                ? config.global.toLocaleString()
                : "..."}
            </p>
          </div> */}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end">
          <button className="btn btn-secondary w-full sm:w-auto" onClick={handleClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}