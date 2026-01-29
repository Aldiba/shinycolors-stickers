import React, { useState, useMemo, useEffect, useRef } from "react";
import charactersData from "../characters.json";

interface Character {
  id: string;
  name: string;
  img: string;
  character?: string;

  series?: string; 
}

interface PickerProps {
  setCharacter: (index: number) => void;
  t: (key: string) => string;
}

const characters = charactersData as Character[];

const CATEGORIES = [
  { id: "all", label: "All" }, 
  { id: "i", label: "Group I" },
  { id: "l", label: "Group L" },
  { id: "h", label: "Group H" },
  { id: "a", label: "Group A" },
  { id: "s", label: "Group S" },
  { id: "n", label: "Group N" },
  { id: "sh", label: "Group SH" },
  { id: "c", label: "Group C" },
];

export default function Picker({ setCharacter, t }: PickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  // 默认
  const [activeCategory, setActiveCategory] = useState<string>("i");
  
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开/关闭逻辑
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
    // 关闭时不重置分类
  };

  const filteredCharacters = useMemo(() => {
    const s = search.toLowerCase().trim();
    
    const withIndex = characters.map((c, index) => ({
      ...c,
      originalIndex: index,
    }));

    return withIndex.filter((c) => {
      const matchesSearch = 
        !s || 
        c.id.toLowerCase().includes(s) ||
        c.name.toLowerCase().includes(s) ||
        (c.character && c.character.toLowerCase().includes(s));

      let matchesCategory = true;
      if (activeCategory !== "all") {
        matchesCategory = c.series === activeCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <>
      <button
        className="btn btn-secondary btn-outline gap-2"
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M1 10.5a1.5 1.5 0 011.5-1.5h15a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 011 13.5v-3zm1.5-.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h15a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-15zM3 4.25A2.25 2.25 0 015.25 2h9.5A2.25 2.25 0 0117 4.25v2a.5.5 0 01-1 0v-2a1.25 1.25 0 00-1.25-1.25h-9.5A1.25 1.25 0 004 4.25v2a.5.5 0 01-1 0v-2z" clipRule="evenodd" />
        </svg>
        {t("pick_character")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          ></div>

          <div className="relative w-full max-w-4xl bg-base-100 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] h-[600px] animate-scale-in border border-base-200 overflow-hidden">
            
            {/* 顶部标题栏 */}
            <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-100 shrink-0 z-20">
              <h3 className="font-bold text-lg">{t("select_character")}</h3>
              <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            {/* 内容区域：Flex 布局，左侧 Sidebar，右侧 Grid */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* === 左侧侧边栏 (Categories) === */}
              <div className="w-[70px] bg-base-200 flex flex-col items-center gap-2 py-4 overflow-y-auto shrink-0 border-r border-base-300">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
                        isActive 
                          ? "bg-white shadow-md scale-100 border-2 border-secondary" 
                          : "hover:bg-base-100/50 hover:scale-105 opacity-70 hover:opacity-100 grayscale hover:grayscale-0"
                      }`}
                      title={cat.label}
                    >
                      {cat.id === "all" ? (
                        // All
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-secondary">
                          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        // 40x40
                        <img 
                          src={`build/ico/${cat.id}.png`} 
                          alt={cat.label} 
                          className="w-10 h-10 object-contain" 
                        />
                      )}
                      
                      {/* 选中时的指示点 */}
                      {isActive && (
                        <div className="absolute -right-[10px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-secondary rounded-l-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* === 右侧主内容区域 === */}
              <div className="flex-1 flex flex-col bg-base-100 overflow-hidden relative">
                
                {/* 搜索框 (固定在Grid上方) */}
                <div className="p-3 border-b border-base-200 bg-base-100/95 backdrop-blur z-10">
                   <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={t("search_placeholder")}
                      className="input input-bordered input-sm w-full pl-9 pr-8 rounded-full bg-base-200 focus:bg-base-100 transition-colors"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle text-gray-400">✕</button>
                    )}
                  </div>
                </div>

                {/* 贴纸 Grid 列表 */}
                <div className="flex-1 overflow-y-auto p-4 bg-base-200/30">
                  {filteredCharacters.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {filteredCharacters.map((c) => (
                        <div
                          key={c.originalIndex}
                          onClick={() => {
                            setCharacter(c.originalIndex);
                            handleClose();
                          }}
                          className="group cursor-pointer flex flex-col gap-2 animate-fade-in"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent group-hover:border-secondary transition-all shadow-sm group-hover:shadow-md bg-white">
                            <img
                              src={`img/${c.img}`}
                              alt={c.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                          </div>
                          <span className="text-xs text-center font-medium truncate px-1 text-gray-600 group-hover:text-secondary">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-30">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{t("no_character_found")}</p>
                    </div>
                  )}
                </div>

                {/* 底部信息 */}
                <div className="p-2 border-t border-base-200 bg-base-100 text-[10px] text-center text-gray-400">
                  {t("showing")} {filteredCharacters.length} {t("of")} {characters.length} {t("characters_count")}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}